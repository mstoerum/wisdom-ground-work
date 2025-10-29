import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, 
  Users, 
  MessageSquare, 
  AlertTriangle,
  ArrowUp,
  Sparkles
} from "lucide-react";

export const DesignMockups = () => {
  return (
    <div className="space-y-12 p-8 bg-gradient-to-br from-blue-50 via-purple-50 to-blue-50">
      {/* Header */}
      <div className="text-center space-y-4">
        <Badge className="bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0">
          <Sparkles className="h-3 w-3 mr-1" />
          New Design Preview
        </Badge>
        <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">
          Spradley 2.0 Design System
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Modern, trustworthy, and engaging interface for employee feedback
        </p>
      </div>

      {/* Color Palette Preview */}
      <Card className="border-0 shadow-2xl shadow-blue-500/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            🎨 Color Palette Transformation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-8">
            {/* Before */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-600 uppercase text-sm">Before (Current)</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 rounded-xl" style={{ backgroundColor: 'hsl(25, 65%, 55%)' }} />
                  <div>
                    <p className="font-medium">Primary: Terracotta</p>
                    <p className="text-sm text-gray-500">HSL(25, 65%, 55%)</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 rounded-xl" style={{ backgroundColor: 'hsl(30, 20%, 97%)' }} />
                  <div>
                    <p className="font-medium">Background: Beige</p>
                    <p className="text-sm text-gray-500">HSL(30, 20%, 97%)</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 rounded-xl border-2" style={{ backgroundColor: 'hsl(35, 50%, 88%)' }} />
                  <div>
                    <p className="font-medium">Secondary: Light Brown</p>
                    <p className="text-sm text-gray-500">HSL(35, 50%, 88%)</p>
                  </div>
                </div>
              </div>
            </div>

            {/* After */}
            <div className="space-y-4">
              <h3 className="font-semibold text-blue-600 uppercase text-sm">After (Modern)</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 rounded-xl shadow-lg" style={{ backgroundColor: 'hsl(217, 91%, 60%)' }} />
                  <div>
                    <p className="font-medium">Primary: Modern Blue</p>
                    <p className="text-sm text-gray-500">HSL(217, 91%, 60%)</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 rounded-xl border shadow-sm" style={{ backgroundColor: 'hsl(0, 0%, 100%)' }} />
                  <div>
                    <p className="font-medium">Background: Pure White</p>
                    <p className="text-sm text-gray-500">HSL(0, 0%, 100%)</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 rounded-xl shadow-lg" style={{ backgroundColor: 'hsl(250, 75%, 68%)' }} />
                  <div>
                    <p className="font-medium">Accent: Soft Purple</p>
                    <p className="text-sm text-gray-500">HSL(250, 75%, 68%)</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Metric Cards Comparison */}
      <Card className="border-0 shadow-2xl shadow-purple-500/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            📊 Metric Cards Redesign
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* Before */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-600 uppercase text-sm">Before (Current Design)</h3>
            <div className="grid md:grid-cols-3 gap-4">
              <Card className="border">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Participation Rate</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">81.4%</div>
                  <p className="text-xs text-green-600">↑ 12.4% from last period</p>
                </CardContent>
              </Card>

              <Card className="border">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Avg Sentiment</CardTitle>
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">7.2</div>
                  <p className="text-xs text-red-600">↓ 3.8% from last period</p>
                </CardContent>
              </Card>

              <Card className="border">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Urgent Flags</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">12</div>
                  <p className="text-xs text-red-600">↑ 20% from last period</p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* After */}
          <div className="space-y-4">
            <h3 className="font-semibold text-blue-600 uppercase text-sm">After (Modern Design)</h3>
            <div className="grid md:grid-cols-3 gap-6">
              {/* Participation Card */}
              <Card className="border-0 shadow-xl shadow-blue-500/10 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 bg-gradient-to-br from-blue-50 to-white">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-3 bg-blue-100 rounded-xl">
                      <Users className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="flex items-center gap-1 bg-green-100 px-2 py-1 rounded-full">
                      <ArrowUp className="h-3 w-3 text-green-600" />
                      <span className="text-xs font-semibold text-green-600">12.4%</span>
                    </div>
                  </div>
                  <p className="text-sm font-medium text-gray-600 uppercase tracking-wide mb-2">
                    Participation Rate
                  </p>
                  <div className="flex items-baseline gap-2">
                    <p className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
                      81.4
                    </p>
                    <span className="text-2xl font-bold text-gray-400">%</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">201 of 247 employees</p>
                </CardContent>
              </Card>

              {/* Sentiment Card */}
              <Card className="border-0 shadow-xl shadow-purple-500/10 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 bg-gradient-to-br from-purple-50 to-white">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-3 bg-purple-100 rounded-xl">
                      <MessageSquare className="h-6 w-6 text-purple-600" />
                    </div>
                    <div className="flex items-center gap-1 bg-red-100 px-2 py-1 rounded-full">
                      <TrendingUp className="h-3 w-3 text-red-600 rotate-180" />
                      <span className="text-xs font-semibold text-red-600">3.8%</span>
                    </div>
                  </div>
                  <p className="text-sm font-medium text-gray-600 uppercase tracking-wide mb-2">
                    Average Sentiment
                  </p>
                  <div className="flex items-baseline gap-2">
                    <p className="text-5xl font-bold bg-gradient-to-r from-purple-600 to-purple-400 bg-clip-text text-transparent">
                      7.2
                    </p>
                    <span className="text-2xl font-bold text-gray-400">/10</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">Based on 201 responses</p>
                </CardContent>
              </Card>

              {/* Urgent Flags Card */}
              <Card className="border-0 shadow-xl shadow-orange-500/10 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 bg-gradient-to-br from-orange-50 to-white">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-3 bg-orange-100 rounded-xl">
                      <AlertTriangle className="h-6 w-6 text-orange-600" />
                    </div>
                    <div className="flex items-center gap-1 bg-orange-100 px-2 py-1 rounded-full">
                      <ArrowUp className="h-3 w-3 text-orange-600" />
                      <span className="text-xs font-semibold text-orange-600">+20%</span>
                    </div>
                  </div>
                  <p className="text-sm font-medium text-gray-600 uppercase tracking-wide mb-2">
                    Urgent Flags
                  </p>
                  <div className="flex items-baseline gap-2">
                    <p className="text-5xl font-bold bg-gradient-to-r from-orange-600 to-orange-400 bg-clip-text text-transparent">
                      12
                    </p>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">Requiring immediate attention</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Button Styles */}
      <Card className="border-0 shadow-2xl shadow-blue-500/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            🔘 Button & Interactive Elements
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* Before */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-600 uppercase text-sm">Before (Current Buttons)</h3>
            <div className="flex flex-wrap gap-3">
              <Button variant="default">Primary Action</Button>
              <Button variant="outline">Secondary Action</Button>
              <Button variant="ghost">Ghost Button</Button>
              <Button variant="destructive">Delete</Button>
            </div>
          </div>

          {/* After */}
          <div className="space-y-4">
            <h3 className="font-semibold text-blue-600 uppercase text-sm">After (Modern Buttons)</h3>
            <div className="flex flex-wrap gap-3">
              <Button className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 shadow-lg shadow-blue-500/30 hover:shadow-xl hover:scale-105 transition-all duration-200">
                Primary Action
              </Button>
              <Button className="border-2 border-blue-600 bg-white hover:bg-blue-50 text-blue-600 shadow-md hover:shadow-lg hover:scale-105 transition-all duration-200">
                Secondary Action
              </Button>
              <Button className="bg-white/80 backdrop-blur-lg border border-gray-200 hover:bg-gray-50 shadow-md hover:shadow-lg transition-all duration-200">
                Ghost Button
              </Button>
              <Button className="bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 shadow-lg shadow-red-500/30 hover:shadow-xl transition-all duration-200">
                Delete
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Typography */}
      <Card className="border-0 shadow-2xl shadow-purple-500/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            ✍️ Typography & Hierarchy
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">
              Main Dashboard Heading
            </h1>
            <h2 className="text-3xl font-semibold text-gray-800">
              Section Title with Emphasis
            </h2>
            <h3 className="text-xl font-medium text-gray-700">
              Subsection Heading
            </h3>
            <p className="text-base text-gray-600 leading-relaxed max-w-2xl">
              Body text with increased line-height for better readability. The new design uses a more generous spacing system and clearer hierarchy to guide the user's eye through the interface naturally.
            </p>
            <p className="text-sm text-gray-500">
              Small supporting text for additional context and metadata
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      <div className="text-center space-y-4 py-8">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Key Design Improvements
        </h2>
        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto mt-8">
          <div className="text-center space-y-2">
            <div className="text-4xl">🎨</div>
            <h3 className="font-semibold">Modern Color Palette</h3>
            <p className="text-sm text-gray-600">Cool blues & purples replace warm earth tones for trust & professionalism</p>
          </div>
          <div className="text-center space-y-2">
            <div className="text-4xl">✨</div>
            <h3 className="font-semibold">Depth & Shadows</h3>
            <p className="text-sm text-gray-600">Soft shadows & glassmorphism create visual hierarchy</p>
          </div>
          <div className="text-center space-y-2">
            <div className="text-4xl">🎯</div>
            <h3 className="font-semibold">Micro-interactions</h3>
            <p className="text-sm text-gray-600">Hover states, animations, and smooth transitions</p>
          </div>
        </div>
      </div>
    </div>
  );
};