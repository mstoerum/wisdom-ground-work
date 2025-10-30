import { supabase } from '@/integrations/supabase/client';

/**
 * AudioRecorder: Captures microphone audio and provides Float32Array chunks
 */
export class AudioRecorder {
  private stream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private processor: ScriptProcessorNode | null = null;
  private source: MediaStreamAudioSourceNode | null = null;

  constructor(private onAudioData: (audioData: Float32Array) => void) {}

  async start() {
    try {
      console.log('🎤 Requesting microphone access...');
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 24000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      
      console.log('✅ Microphone access granted');
      
      this.audioContext = new AudioContext({
        sampleRate: 24000,
      });
      
      this.source = this.audioContext.createMediaStreamSource(this.stream);
      this.processor = this.audioContext.createScriptProcessor(4096, 1, 1);
      
      this.processor.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);
        this.onAudioData(new Float32Array(inputData));
      };
      
      this.source.connect(this.processor);
      this.processor.connect(this.audioContext.destination);
      
      console.log('🎵 Audio processing started');
    } catch (error) {
      console.error('❌ Error accessing microphone:', error);
      throw error;
    }
  }

  stop() {
    console.log('🛑 Stopping audio recorder...');
    if (this.source) {
      this.source.disconnect();
      this.source = null;
    }
    if (this.processor) {
      this.processor.disconnect();
      this.processor = null;
    }
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    console.log('✅ Audio recorder stopped');
  }
}

/**
 * Encode Float32Array audio to base64 PCM16 for OpenAI Realtime API
 */
export const encodeAudioForAPI = (float32Array: Float32Array): string => {
  const int16Array = new Int16Array(float32Array.length);
  for (let i = 0; i < float32Array.length; i++) {
    const s = Math.max(-1, Math.min(1, float32Array[i]));
    int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
  }
  
  const uint8Array = new Uint8Array(int16Array.buffer);
  let binary = '';
  const chunkSize = 0x8000;
  
  for (let i = 0; i < uint8Array.length; i += chunkSize) {
    const chunk = uint8Array.subarray(i, Math.min(i + chunkSize, uint8Array.length));
    binary += String.fromCharCode(...Array.from(chunk));
  }
  
  return btoa(binary);
};

/**
 * RealtimeChat: WebRTC-based client for OpenAI Realtime API
 */
export class RealtimeChat {
  private pc: RTCPeerConnection | null = null;
  private dc: RTCDataChannel | null = null;
  private audioEl: HTMLAudioElement;
  private recorder: AudioRecorder | null = null;

  constructor(
    private onMessage: (message: any) => void,
    private isPreviewMode: boolean = false,
    private surveyData?: { first_message?: string; themes?: Array<{ name: string; description: string }> }
  ) {
    this.audioEl = document.createElement("audio");
    this.audioEl.autoplay = true;
  }

  async init() {
    try {
      console.log('🚀 Initializing RealtimeChat...');
      console.log('🔍 Preview mode:', this.isPreviewMode);
      
      // Get ephemeral token from our Supabase Edge Function
      console.log('🎫 Fetching ephemeral token...');
      const { data, error } = await supabase.functions.invoke("realtime-session", {
        body: { 
          preview: this.isPreviewMode,
          surveyData: this.surveyData
        }
      });

      if (error) {
        console.error('❌ Error fetching token:', error);
        throw new Error(`Failed to get ephemeral token: ${error.message}`);
      }

      if (!data?.client_secret?.value) {
        console.error('❌ No client_secret in response:', data);
        throw new Error("Failed to get ephemeral token from response");
      }

      const EPHEMERAL_KEY = data.client_secret.value;
      console.log('✅ Ephemeral token received');

      // Create peer connection
      console.log('🔗 Creating RTCPeerConnection...');
      this.pc = new RTCPeerConnection();

      // Set up remote audio
      this.pc.ontrack = e => {
        console.log('🔊 Remote audio track received');
        this.audioEl.srcObject = e.streams[0];
      };

      // Add local audio track
      console.log('🎤 Setting up local audio...');
      const ms = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 24000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      this.pc.addTrack(ms.getTracks()[0]);

      // Set up data channel
      console.log('📡 Creating data channel...');
      this.dc = this.pc.createDataChannel("oai-events");
      
      this.dc.addEventListener("message", (e) => {
        const event = JSON.parse(e.data);
        console.log("📨 Received event:", event.type);
        this.onMessage(event);
      });

      this.dc.addEventListener("open", () => {
        console.log("✅ Data channel opened");
      });

      this.dc.addEventListener("close", () => {
        console.log("🔌 Data channel closed");
      });

      this.dc.addEventListener("error", (e) => {
        console.error("❌ Data channel error:", e);
      });

      // Create and set local description
      console.log('📝 Creating offer...');
      const offer = await this.pc.createOffer();
      await this.pc.setLocalDescription(offer);

      // Connect to OpenAI's Realtime API
      console.log('🌐 Connecting to OpenAI Realtime API...');
      const baseUrl = "https://api.openai.com/v1/realtime";
      const model = "gpt-4o-realtime-preview-2024-12-17";
      const sdpResponse = await fetch(`${baseUrl}?model=${model}`, {
        method: "POST",
        body: offer.sdp,
        headers: {
          Authorization: `Bearer ${EPHEMERAL_KEY}`,
          "Content-Type": "application/sdp"
        },
      });

      if (!sdpResponse.ok) {
        const errorText = await sdpResponse.text();
        console.error('❌ SDP exchange failed:', sdpResponse.status, errorText);
        throw new Error(`SDP exchange failed: ${sdpResponse.status}`);
      }

      const answer = {
        type: "answer" as RTCSdpType,
        sdp: await sdpResponse.text(),
      };
      
      await this.pc.setRemoteDescription(answer);
      console.log('✅ WebRTC connection established');

      // Start recording
      console.log('🎙️ Starting audio recorder...');
      this.recorder = new AudioRecorder((audioData) => {
        if (this.dc?.readyState === 'open') {
          this.dc.send(JSON.stringify({
            type: 'input_audio_buffer.append',
            audio: encodeAudioForAPI(audioData)
          }));
        }
      });
      await this.recorder.start();
      
      // Trigger initial greeting from AI
      // Wait a moment for connection to stabilize, then request initial response
      setTimeout(() => {
        if (this.dc?.readyState === 'open') {
          console.log('🎤 Triggering initial AI greeting...');
          // Send response.create to trigger AI to speak first
          this.dc.send(JSON.stringify({ type: 'response.create' }));
        }
      }, 1000);
      
      console.log('✅ RealtimeChat initialization complete');

    } catch (error) {
      console.error("❌ Error initializing chat:", error);
      throw error;
    }
  }

  async sendMessage(text: string) {
    if (!this.dc || this.dc.readyState !== 'open') {
      throw new Error('Data channel not ready');
    }

    console.log('📤 Sending text message:', text);

    const event = {
      type: 'conversation.item.create',
      item: {
        type: 'message',
        role: 'user',
        content: [
          {
            type: 'input_text',
            text
          }
        ]
      }
    };

    this.dc.send(JSON.stringify(event));
    this.dc.send(JSON.stringify({type: 'response.create'}));
  }

  disconnect() {
    console.log('🔌 Disconnecting RealtimeChat...');
    this.recorder?.stop();
    this.dc?.close();
    this.pc?.close();
    console.log('✅ RealtimeChat disconnected');
  }
}
