import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui';

/**
 * DesignSystemTestPage - Comprehensive Component Showcase
 * 
 * Now featuring Shadcn/ui components integrated with your design system!
 * Use this page to perfect all components before rolling them out to the app.
 * Features: All design tokens, component variations, layouts, and dark/light mode testing
 */

export const DesignSystemTestPage: React.FC = () => {
  const [showModal, setShowModal] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  React.useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      {/* Top Navigation Bar */}
      <nav className="sticky top-0 z-50 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between px-6 h-14">
          <div className="flex items-center gap-8">
            <h1 className="text-sm font-bold text-slate-900 dark:text-slate-50">Design System</h1>
            <div className="hidden lg:flex items-center gap-6 text-xs">
              <a href="#intro" className="text-slate-600 dark:text-slate-400 hover:text-primary font-medium">Intro</a>
              <a href="#foundations" className="text-slate-600 dark:text-slate-400 hover:text-primary font-medium">Foundations</a>
              <a href="#components" className="text-slate-600 dark:text-slate-400 hover:text-primary font-medium">Components</a>
              <a href="#blocks" className="text-slate-600 dark:text-slate-400 hover:text-primary font-medium">Blocks</a>
              <a href="#github" className="text-slate-600 dark:text-slate-400 hover:text-primary font-medium">GitHub</a>
              <a href="#directory" className="text-slate-600 dark:text-slate-400 hover:text-primary font-medium">Directory</a>
              <a href="#guides" className="text-slate-600 dark:text-slate-400 hover:text-primary font-medium">Guides</a>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-sm"
              title="Toggle theme"
            >
              {isDarkMode ? '☀️' : '🌙'}
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <div className="flex">
        {/* Left Sidebar */}
        <aside className="hidden xl:block w-64 border-r border-slate-200 dark:border-slate-800 h-[calc(100vh-3.5rem)] sticky top-14 overflow-y-auto bg-slate-50 dark:bg-slate-900">
          <div className="p-4 space-y-6">
            <div>
              <h3 className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2 px-2">Getting Started</h3>
              <div className="space-y-0.5">
                <a href="#introduction" className="block px-2 py-1.5 text-xs text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 rounded-md transition-colors">Introduction</a>
                <a href="#installation" className="block px-2 py-1.5 text-xs text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 rounded-md transition-colors">Installation</a>
              </div>
            </div>

            <div>
              <h3 className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2 px-2">Design Tokens</h3>
              <div className="space-y-0.5">
                <a href="#colors" className="block px-2 py-1.5 text-xs text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 rounded-md transition-colors">Colors</a>
                <a href="#typography" className="block px-2 py-1.5 text-xs text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 rounded-md transition-colors">Typography</a>
                <a href="#spacing" className="block px-2 py-1.5 text-xs text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 rounded-md transition-colors">Spacing</a>
                <a href="#shadows" className="block px-2 py-1.5 text-xs text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 rounded-md transition-colors">Shadows</a>
              </div>
            </div>

            <div>
              <h3 className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2 px-2">Components</h3>
              <div className="space-y-0.5">
                <a href="#shadcn" className="block px-2 py-1.5 text-xs font-medium text-primary bg-primary/10 rounded-md">Shadcn/ui</a>
                <a href="#buttons" className="block px-2 py-1.5 text-xs text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 rounded-md transition-colors">Buttons</a>
                <a href="#forms" className="block px-2 py-1.5 text-xs text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 rounded-md transition-colors">Forms</a>
                <a href="#cards" className="block px-2 py-1.5 text-xs text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 rounded-md transition-colors">Cards</a>
                <a href="#badges" className="block px-2 py-1.5 text-xs text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 rounded-md transition-colors">Badges</a>
                <a href="#tables" className="block px-2 py-1.5 text-xs text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 rounded-md transition-colors">Tables</a>
                <a href="#alerts" className="block px-2 py-1.5 text-xs text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 rounded-md transition-colors">Alerts</a>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 max-w-[1400px] mx-auto px-6 py-8">
          
          {/* Hero Section */}
          <div className="mb-12">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-primary/10 text-primary text-[10px] font-semibold rounded-full mb-3">
              <span>🎨</span>
              <span>Design System v1.0</span>
            </div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50 mb-3 leading-tight">
              ShuttleCoach Design System
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 max-w-3xl leading-relaxed">
              A comprehensive collection of reusable components, design tokens, and guidelines built with 
              <span className="font-semibold text-primary"> Shadcn/ui</span>, 
              <span className="font-semibold"> Tailwind CSS</span>, and 
              <span className="font-semibold"> Radix UI</span> for building accessible, beautiful interfaces.
            </p>
          </div>

        {/* ========== SHADCN/UI COMPONENTS SECTION ========== */}
        <section id="shadcn" className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50 mb-1">Shadcn/ui Components</h2>
              <p className="text-xs text-slate-600 dark:text-slate-400">Production-ready components with Radix UI primitives</p>
            </div>
            <Badge variant="success">Accessible</Badge>
          </div>
          
          {/* Component Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            
            {/* Buttons Card */}
            <Card className="overflow-hidden">
              <CardHeader className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 py-3 px-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-sm font-semibold">Button</CardTitle>
                    <CardDescription className="text-xs mt-0.5">Clickable button component with multiple variants</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">Variants</p>
                  <div className="flex flex-wrap gap-1.5">
                    <Button size="sm" className="text-xs h-7 px-3">Primary</Button>
                    <Button size="sm" variant="secondary" className="text-xs h-7 px-3">Secondary</Button>
                    <Button size="sm" variant="outline" className="text-xs h-7 px-3">Outline</Button>
                    <Button size="sm" variant="ghost" className="text-xs h-7 px-3">Ghost</Button>
                    <Button size="sm" variant="destructive" className="text-xs h-7 px-3">Danger</Button>
                  </div>
                </div>
                
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">Sizes</p>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Button size="sm" className="text-xs h-7 px-3">Small</Button>
                    <Button className="text-xs h-8 px-4">Default</Button>
                    <Button size="lg" className="text-sm h-9 px-5">Large</Button>
                  </div>
                </div>

                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">States</p>
                  <div className="flex flex-wrap gap-1.5">
                    <Button size="sm" disabled className="text-xs h-7 px-3">Disabled</Button>
                    <Button size="sm" className="text-xs h-7 px-3">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      With Icon
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Input Card */}
            <Card className="overflow-hidden">
              <CardHeader className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 py-3 px-4">
                <CardTitle className="text-sm font-semibold">Input & Label</CardTitle>
                <CardDescription className="text-xs mt-0.5">Form input fields with accessible labels</CardDescription>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="name" className="text-[10px]">Full Name</Label>
                  <Input id="name" placeholder="John Doe" className="h-8 text-xs" />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-[10px]">Email Address</Label>
                  <Input id="email" type="email" placeholder="john@example.com" className="h-8 text-xs" />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="password" className="text-[10px]">Password</Label>
                  <Input id="password" type="password" placeholder="••••••••" className="h-8 text-xs" />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="disabled" className="text-[10px]">Disabled Input</Label>
                  <Input id="disabled" placeholder="Cannot edit" disabled className="h-8 text-xs" />
                </div>
              </CardContent>
            </Card>

            {/* Badge Card */}
            <Card className="overflow-hidden">
              <CardHeader className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 py-3 px-4">
                <CardTitle className="text-sm font-semibold">Badge</CardTitle>
                <CardDescription className="text-xs mt-0.5">Small status indicators and labels</CardDescription>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">Status</p>
                  <div className="flex flex-wrap gap-1.5">
                    <Badge className="text-[10px] px-2 py-0.5">Default</Badge>
                    <Badge variant="success" className="text-[10px] px-2 py-0.5">Success</Badge>
                    <Badge variant="warning" className="text-[10px] px-2 py-0.5">Warning</Badge>
                    <Badge variant="danger" className="text-[10px] px-2 py-0.5">Danger</Badge>
                    <Badge variant="info" className="text-[10px] px-2 py-0.5">Info</Badge>
                  </div>
                </div>

                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">Styles</p>
                  <div className="flex flex-wrap gap-1.5">
                    <Badge variant="outline" className="text-[10px] px-2 py-0.5">Outline</Badge>
                    <Badge variant="secondary" className="text-[10px] px-2 py-0.5">Secondary</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Card Component Card */}
            <Card className="overflow-hidden">
              <CardHeader className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 py-3 px-4">
                <CardTitle className="text-sm font-semibold">Card</CardTitle>
                <CardDescription className="text-xs mt-0.5">Container with header, content, and footer</CardDescription>
              </CardHeader>
              <CardContent className="p-4">
                <Card className="shadow-sm">
                  <CardHeader className="pb-2 pt-3 px-3">
                    <CardTitle className="text-xs font-semibold">Example Card</CardTitle>
                    <CardDescription className="text-[10px]">This is a card description</CardDescription>
                  </CardHeader>
                  <CardContent className="text-xs text-slate-700 dark:text-slate-300 px-3 pb-2">
                    Cards can contain any content and are composable with sections.
                  </CardContent>
                  <CardFooter className="pt-2 pb-3 px-3">
                    <Button size="sm" className="text-xs h-6 px-2">Action</Button>
                  </CardFooter>
                </Card>
              </CardContent>
            </Card>

          </div>

          {/* Code Example */}
          <div className="mt-4 p-4 bg-slate-900 dark:bg-slate-950 rounded-md border border-slate-800">
            <p className="text-[10px] font-semibold text-slate-400 mb-2">IMPORT COMPONENTS</p>
            <pre className="text-xs text-slate-300 font-mono overflow-x-auto">
{`import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';`}
            </pre>
          </div>
        </section>

        {/* ========== COLORS SECTION ========== */}
        <section id="colors" className="mb-12">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50 mb-1">Color System</h2>
            <p className="text-xs text-slate-600 dark:text-slate-400">Our carefully crafted color palette for consistent branding</p>
          </div>
          
          {/* Primary Color */}
          <Card className="mb-4 overflow-hidden">
            <CardHeader className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 py-3 px-4">
              <CardTitle className="text-sm font-semibold">Primary - Electric Lime</CardTitle>
              <CardDescription className="text-xs mt-0.5">Main brand color for CTAs and accents</CardDescription>
            </CardHeader>
            <CardContent className="p-4">
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {[300, 400, 500, 600, 700, 800].map((shade) => (
                  <div key={shade} className="space-y-1.5">
                    <div className={`w-full aspect-square rounded-md bg-primary-${shade} border border-slate-200 dark:border-slate-700`}></div>
                    <div className="text-center">
                      <p className="text-[10px] font-semibold text-slate-900 dark:text-slate-100">{shade}</p>
                      <p className="text-[9px] text-slate-500 dark:text-slate-400">primary-{shade}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Semantic Colors */}
          <Card className="mb-4 overflow-hidden">
            <CardHeader className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 py-3 px-4">
              <CardTitle className="text-sm font-semibold">Semantic Colors</CardTitle>
              <CardDescription className="text-xs mt-0.5">Contextual colors for feedback and status</CardDescription>
            </CardHeader>
            <CardContent className="p-4">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="space-y-2">
                  <div className="w-full aspect-square rounded-md bg-success flex items-center justify-center text-white text-xs font-bold">
                    Success
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">Success</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">#22C55E</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="w-full aspect-square rounded-md bg-warning flex items-center justify-center text-slate-900 text-xs font-bold">
                    Warning
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">Warning</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">#F59E0B</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="w-full aspect-square rounded-md bg-danger flex items-center justify-center text-white text-xs font-bold">
                    Danger
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">Danger</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">#EF4444</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="w-full aspect-square rounded-md bg-info flex items-center justify-center text-white text-xs font-bold">
                    Info
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">Info</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">#3B82F6</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Neutral Slate */}
          <Card className="overflow-hidden">
            <CardHeader className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 py-3 px-4">
              <CardTitle className="text-sm font-semibold">Neutral Scale</CardTitle>
              <CardDescription className="text-xs mt-0.5">Slate gray scale for text, backgrounds, and borders</CardDescription>
            </CardHeader>
            <CardContent className="p-4">
              <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-11 gap-1.5">
                {[50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950].map((shade) => (
                  <div key={shade} className="space-y-1">
                    <div className={`w-full aspect-square rounded-md bg-slate-${shade} border border-slate-300 dark:border-slate-600`}></div>
                    <p className="text-[9px] text-center text-slate-600 dark:text-slate-400">{shade}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        {/* ========== TYPOGRAPHY SECTION ========== */}
        <section id="typography" className="mb-12">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50 mb-1">Typography</h2>
            <p className="text-xs text-slate-600 dark:text-slate-400">Font hierarchy and text styles</p>
          </div>
          
          <div className="rounded-md shadow-card bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-6">
            <div className="space-y-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">Display (32px, Bold)</p>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">The quick brown fox</h1>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">H1 (24px, Bold)</p>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">The quick brown fox jumps over the lazy dog</h1>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">H2 (20px, Semibold)</p>
                <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50">The quick brown fox jumps over the lazy dog</h2>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">H3 (16px, Semibold)</p>
                <h3 className="text-base font-semibold text-slate-900 dark:text-slate-50">The quick brown fox jumps over the lazy dog</h3>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">Body (14px, Regular)</p>
                <p className="text-sm text-slate-700 dark:text-slate-300">The quick brown fox jumps over the lazy dog. This is standard body text used throughout the application for readability and consistency.</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">Small (12px, Regular)</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">The quick brown fox jumps over the lazy dog</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">Label (10px, Semibold, Uppercase)</p>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">Label Text Example</span>
              </div>
            </div>
          </div>
        </section>

        {/* ========== BUTTONS SECTION ========== */}
        <section id="buttons" className="mb-12">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50 mb-1">Buttons</h2>
            <p className="text-xs text-slate-600 dark:text-slate-400">Button styles, variants, and states</p>
          </div>
          
          <div className="rounded-md shadow-card bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-6 space-y-6">
            {/* Primary Buttons */}
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50 mb-3">Primary Buttons</h3>
              <div className="flex flex-wrap gap-2">
                <button className="px-5 py-2.5 text-sm bg-primary hover:bg-primary-600 text-slate-900 font-semibold rounded-md transition-all">Large Primary</button>
                <button className="px-4 py-2 text-xs bg-primary hover:bg-primary-600 text-slate-900 font-semibold rounded-md transition-all">Medium Primary</button>
                <button className="px-3 py-1.5 text-xs bg-primary hover:bg-primary-600 text-slate-900 font-semibold rounded-md transition-all">Small Primary</button>
                <button className="px-4 py-2 text-xs bg-primary text-slate-900 font-semibold rounded-md opacity-50 cursor-not-allowed" disabled>Disabled</button>
                <button 
                  className="px-4 py-2 text-xs bg-primary hover:bg-primary-600 text-slate-900 font-semibold rounded-md transition-all flex items-center gap-2"
                  onClick={() => {
                    setIsLoading(true);
                    setTimeout(() => setIsLoading(false), 2000);
                  }}
                >
                  {isLoading ? (
                    <>
                      <div className="w-3 h-3 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
                      Loading...
                    </>
                  ) : (
                    'Click to Load'
                  )}
                </button>
              </div>
            </div>

            {/* Secondary & Other Variants */}
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50 mb-3">Button Variants</h3>
              <div className="flex flex-wrap gap-2">
                <button className="px-4 py-2 text-xs bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-900 dark:text-slate-100 font-semibold rounded-md transition-all">Secondary</button>
                <button className="px-4 py-2 text-xs border-2 border-primary text-primary hover:bg-primary/10 font-semibold rounded-md transition-all">Outline</button>
                <button className="px-4 py-2 text-xs text-primary hover:bg-primary/10 font-semibold rounded-md transition-all">Ghost</button>
                <button className="px-4 py-2 text-xs bg-danger hover:bg-danger-dark text-white font-semibold rounded-md transition-all">Danger</button>
                <button className="px-4 py-2 text-xs bg-success hover:bg-success-dark text-white font-semibold rounded-md transition-all">Success</button>
              </div>
            </div>

            {/* Icon Buttons */}
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50 mb-3">Icon Buttons</h3>
              <div className="flex flex-wrap gap-2">
                <button className="w-8 h-8 flex items-center justify-center rounded-md text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
                <button className="w-8 h-8 flex items-center justify-center rounded-md text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
                <button className="w-8 h-8 flex items-center justify-center rounded-md bg-primary text-slate-900 hover:bg-primary-600 transition-all">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ========== FORMS SECTION ========== */}
        <section id="forms" className="mb-12">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50 mb-1">Form Elements</h2>
            <p className="text-xs text-slate-600 dark:text-slate-400">Input fields, selects, textareas, and controls</p>
          </div>
          
          <div className="rounded-md shadow-card bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 max-w-4xl">
              {/* Text Input */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">Text Input</label>
                <input 
                  type="text"
                  placeholder="Enter text..."
                  className="w-full h-9 px-3 py-2 text-xs rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                />
                <p className="text-[10px] text-slate-500 dark:text-slate-400">Helper text goes here</p>
              </div>

              {/* Input with Error */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">With Error</label>
                <input 
                  type="text"
                  placeholder="error@example.com"
                  className="w-full h-9 px-3 py-2 text-xs rounded-md border-2 border-danger bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-danger transition-all"
                />
                <p className="text-[10px] text-danger">This field is required</p>
              </div>

              {/* Select Dropdown */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">Select Dropdown</label>
                <select className="w-full h-9 px-3 py-2 text-xs rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary transition-all">
                  <option>Select an option...</option>
                  <option>Option 1</option>
                  <option>Option 2</option>
                  <option>Option 3</option>
                </select>
              </div>

              {/* Textarea */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">Textarea</label>
                <textarea
                  rows={3}
                  placeholder="Enter long text..."
                  className="w-full px-3 py-2 text-xs rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary transition-all resize-y"
                />
              </div>

              {/* Checkbox */}
              <div className="space-y-2">
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">Checkboxes</label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-primary focus:ring-2 focus:ring-primary" />
                  <span className="text-xs text-slate-900 dark:text-slate-100">Option 1</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-primary focus:ring-2 focus:ring-primary" readOnly />
                  <span className="text-xs text-slate-900 dark:text-slate-100">Option 2 (checked)</span>
                </label>
              </div>

              {/* Radio Buttons */}
              <div className="space-y-2">
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">Radio Buttons</label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="radio" className="w-4 h-4 border-slate-300 dark:border-slate-600 text-primary focus:ring-2 focus:ring-primary" />
                  <span className="text-xs text-slate-900 dark:text-slate-100">Choice A</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="radio" checked className="w-4 h-4 border-slate-300 dark:border-slate-600 text-primary focus:ring-2 focus:ring-primary" readOnly />
                  <span className="text-xs text-slate-900 dark:text-slate-100">Choice B (selected)</span>
                </label>
              </div>
            </div>
          </div>
        </section>

        {/* ========== CARDS SECTION ========== */}
        <section id="cards" className="mb-12">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50 mb-1">Cards & Panels</h2>
            <p className="text-xs text-slate-600 dark:text-slate-400">Container components for grouping content</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Standard Card */}
            <div className="rounded-md shadow-card bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50 mb-1.5">Standard Card</h3>
              <p className="text-xs text-slate-700 dark:text-slate-300">
                This is a standard card with shadow-card, border, and padding p-4.
              </p>
            </div>

            {/* Hover Card */}
            <div className="rounded-md shadow-card bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4 hover:shadow-float hover:-translate-y-1 transition-all cursor-pointer">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50 mb-1.5">Hover Card</h3>
              <p className="text-xs text-slate-700 dark:text-slate-300">
                Hover to see elevation change and lift effect.
              </p>
            </div>

            {/* Accent Border Card */}
            <div className="rounded-md shadow-card bg-white dark:bg-slate-800 border-l-4 border-primary p-4">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50 mb-1.5">Accent Border</h3>
              <p className="text-xs text-slate-700 dark:text-slate-300">
                Left border accent with primary color.
              </p>
            </div>

            {/* Stat Card Example */}
            <div className="rounded-md shadow-card bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-md bg-info/10 dark:bg-info/20 text-info flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-0.5">Total Students</p>
                  <p className="text-xl font-bold text-slate-900 dark:text-slate-50">142</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Active students</p>
                </div>
              </div>
            </div>

            {/* Card with Header & Footer */}
            <div className="rounded-md shadow-card bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50">Card Header</h3>
              </div>
              <div className="p-4">
                <p className="text-xs text-slate-700 dark:text-slate-300">Card content with separate header and footer sections.</p>
              </div>
              <div className="px-4 py-3 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-2">
                <button className="px-3 py-1.5 text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md">Cancel</button>
                <button className="px-3 py-1.5 text-xs bg-primary hover:bg-primary-600 text-slate-900 font-semibold rounded-md">Save</button>
              </div>
            </div>
          </div>
        </section>

        {/* ========== BADGES SECTION ========== */}
        <section id="badges" className="mb-12">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50 mb-1">Badges & Tags</h2>
            <p className="text-xs text-slate-600 dark:text-slate-400">Status indicators and labels</p>
          </div>
          
          <div className="rounded-md shadow-card bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50 mb-2">Status Badges</h3>
                <div className="flex flex-wrap gap-1.5">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide bg-success/10 dark:bg-success/20 text-success-dark dark:text-success-light">Success</span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide bg-warning/10 dark:bg-warning/20 text-warning-dark dark:text-warning-light">Warning</span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide bg-danger/10 dark:bg-danger/20 text-danger-dark dark:text-danger-light">Danger</span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide bg-info/10 dark:bg-info/20 text-info-dark dark:text-info-light">Info</span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide bg-primary/10 dark:bg-primary/20 text-primary-700 dark:text-primary-300">Primary</span>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50 mb-2">Skill Level Badges</h3>
                <div className="flex flex-wrap gap-1.5">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wide bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">Beginner</span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wide bg-info/10 dark:bg-info/20 text-info-dark dark:text-info-light">Intermediate</span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wide bg-warning/10 dark:bg-warning/20 text-warning-dark dark:text-warning-light">Advanced</span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wide bg-primary/10 dark:bg-primary/20 text-primary-700 dark:text-primary-300">Expert</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ========== TABLES SECTION ========== */}
        <section id="tables" className="mb-12">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50 mb-1">Tables</h2>
            <p className="text-xs text-slate-600 dark:text-slate-400">Data table layouts and patterns</p>
          </div>
          
          <div className="overflow-x-auto rounded-md border border-slate-200 dark:border-slate-700 shadow-card">
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">Name</th>
                  <th className="px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">Status</th>
                  <th className="px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">Role</th>
                  <th className="px-4 py-2.5 text-right text-[10px] font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-200 dark:divide-slate-700">
                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="px-4 py-3 text-xs font-medium text-slate-900 dark:text-slate-100">John Doe</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide bg-success/10 dark:bg-success/20 text-success-dark dark:text-success-light">Active</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-700 dark:text-slate-300">Head Coach</td>
                  <td className="px-4 py-3 text-right">
                    <button className="text-primary hover:text-primary-600 font-medium text-xs">Edit</button>
                  </td>
                </tr>
                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="px-4 py-3 text-xs font-medium text-slate-900 dark:text-slate-100">Jane Smith</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide bg-warning/10 dark:bg-warning/20 text-warning-dark dark:text-warning-light">Pending</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-700 dark:text-slate-300">Assistant Coach</td>
                  <td className="px-4 py-3 text-right">
                    <button className="text-primary hover:text-primary-600 font-medium text-xs">Edit</button>
                  </td>
                </tr>
                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="px-4 py-3 text-xs font-medium text-slate-900 dark:text-slate-100">Mike Johnson</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide bg-danger/10 dark:bg-danger/20 text-danger-dark dark:text-danger-light">Inactive</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-700 dark:text-slate-300">Student</td>
                  <td className="px-4 py-3 text-right">
                    <button className="text-primary hover:text-primary-600 font-medium text-xs">Edit</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* ========== ALERTS SECTION ========== */}
        <section id="alerts" className="mb-12">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50 mb-1">Alerts & Notifications</h2>
            <p className="text-xs text-slate-600 dark:text-slate-400">Feedback and status messages</p>
          </div>
          
          <div className="space-y-3">
            {/* Success Alert */}
            <div className="flex items-start gap-2.5 p-3 rounded-md bg-success/10 dark:bg-success/20 border-l-4 border-success">
              <svg className="w-4 h-4 text-success flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <div>
                <p className="text-xs font-semibold text-success-dark dark:text-success-light mb-0.5">Success!</p>
                <p className="text-xs text-slate-700 dark:text-slate-300">Your changes have been saved successfully.</p>
              </div>
            </div>

            {/* Info Alert */}
            <div className="flex items-start gap-2.5 p-3 rounded-md bg-info/10 dark:bg-info/20 border-l-4 border-info">
              <svg className="w-4 h-4 text-info flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <div>
                <p className="text-xs font-semibold text-info-dark dark:text-info-light mb-0.5">Information</p>
                <p className="text-xs text-slate-700 dark:text-slate-300">Please review the new curriculum guidelines before next session.</p>
              </div>
            </div>

            {/* Warning Alert */}
            <div className="flex items-start gap-2.5 p-3 rounded-md bg-warning/10 dark:bg-warning/20 border-l-4 border-warning">
              <svg className="w-4 h-4 text-warning flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div>
                <p className="text-xs font-semibold text-warning-dark dark:text-warning-light mb-0.5">Warning</p>
                <p className="text-xs text-slate-700 dark:text-slate-300">Some students have overdue fee payments.</p>
              </div>
            </div>

            {/* Error Alert */}
            <div className="flex items-start gap-2.5 p-3 rounded-md bg-danger/10 dark:bg-danger/20 border-l-4 border-danger">
              <svg className="w-4 h-4 text-danger flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <div>
                <p className="text-xs font-semibold text-danger-dark dark:text-danger-light mb-0.5">Error</p>
                <p className="text-xs text-slate-700 dark:text-slate-300">Failed to save changes. Please try again.</p>
              </div>
            </div>
          </div>
        </section>

        {/* ========== MODALS SECTION ========== */}
        <section id="modals" className="mb-12">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50 mb-1">Modals & Dialogs</h2>
            <p className="text-xs text-slate-600 dark:text-slate-400">Overlay dialogs and popups</p>
          </div>
          
          <div className="rounded-md shadow-card bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-6">
            <button
              onClick={() => setShowModal(true)}
              className="px-4 py-2 text-xs bg-primary hover:bg-primary-600 text-slate-900 font-semibold rounded-md transition-all"
            >
              Open Modal Example
            </button>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">Click to see modal overlay and dialog</p>
          </div>
        </section>

        {/* ========== LAYOUTS SECTION ========== */}
        <section id="layouts" className="mb-12">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50 mb-1">Layout Patterns</h2>
            <p className="text-xs text-slate-600 dark:text-slate-400">Grid systems and responsive layouts</p>
          </div>
          
          <div className="space-y-6">
            {/* Two Column Layout */}
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50 mb-3">Two Column Grid</h3>
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-1">
                <div className="rounded-md shadow-card bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4">
                  <p className="text-xs text-slate-700 dark:text-slate-300">Column 1 - Stacks on mobile (lg:grid-cols-1)</p>
                </div>
                <div className="rounded-md shadow-card bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4">
                  <p className="text-xs text-slate-700 dark:text-slate-300">Column 2</p>
                </div>
              </div>
            </div>

            {/* Four Column Grid */}
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50 mb-3">Four Column Grid (Responsive)</h3>
              <div className="grid grid-cols-4 gap-4 xl:grid-cols-3 lg:grid-cols-2 sm:grid-cols-1">
                <div className="rounded-md shadow-card bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4 text-center">
                  <p className="text-xs text-slate-700 dark:text-slate-300">Card 1</p>
                </div>
                <div className="rounded-md shadow-card bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4 text-center">
                  <p className="text-xs text-slate-700 dark:text-slate-300">Card 2</p>
                </div>
                <div className="rounded-md shadow-card bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4 text-center">
                  <p className="text-xs text-slate-700 dark:text-slate-300">Card 3</p>
                </div>
                <div className="rounded-md shadow-card bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4 text-center">
                  <p className="text-xs text-slate-700 dark:text-slate-300">Card 4</p>
                </div>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-2">Resize to see: 4 cols → 3 cols (xl) → 2 cols (lg) → 1 col (sm)</p>
            </div>

            {/* Spacing Examples */}
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50 mb-3">Spacing Scale</h3>
              <div className="rounded-md shadow-card bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-6">
                <div className="space-y-2.5">
                  {[
                    { name: 'gap-2', value: '8px' },
                    { name: 'gap-3', value: '12px' },
                    { name: 'gap-4', value: '16px' },
                    { name: 'gap-6', value: '24px' },
                    { name: 'gap-9', value: '36px' },
                    { name: 'gap-12', value: '48px' },
                  ].map((space) => (
                    <div key={space.name} className="flex items-center gap-3">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 w-16">{space.name}</span>
                      <div className="bg-primary h-5 rounded-sm" style={{ width: space.value }}></div>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400">{space.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

          {/* Footer */}
          <footer className="mt-16 pt-8 border-t border-slate-200 dark:border-slate-800 text-center">
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">
              Design System • ShuttleCoach • Built with Shadcn/ui + Tailwind CSS
            </p>
            <p className="text-[10px] text-slate-500 dark:text-slate-500">
              WCAG AA Compliant • Fully Accessible • Dark Mode Ready
            </p>
          </footer>

        </main>
      </div>

      {/* MODAL OVERLAY */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-40 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-800 rounded-md shadow-overlay border border-slate-200 dark:border-slate-700 max-w-lg w-full p-5 animate-scale-in">
            {/* Modal Header */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50">
                Modal Title
              </h2>
              <button 
                onClick={() => setShowModal(false)}
                className="w-7 h-7 flex items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Modal Body */}
            <div className="mb-5">
              <p className="text-xs text-slate-700 dark:text-slate-300">
                This is an example modal dialog showcasing the design system.
              </p>
              
              <div className="mt-3 space-y-2">
                <Input placeholder="Example input..." className="h-9 text-xs" />
              </div>
            </div>
            
            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-2">
              <Button onClick={() => setShowModal(false)} variant="secondary" size="sm" className="text-xs h-8">
                Cancel
              </Button>
              <Button onClick={() => setShowModal(false)} size="sm" className="text-xs h-8">
                Confirm
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default DesignSystemTestPage;

