import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RocketIcon, DownloadIcon, ZapIcon, CheckCircle2Icon, DatabaseIcon, CodeIcon, LayoutGridIcon, HeartIcon } from "lucide-react";

export default function Home() {
  return (
    <div className="container mx-auto px-6 py-12 max-w-6xl">
      <div className="text-center mb-12">
        <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          AbsurderSQL
        </h1>
        <p className="text-2xl text-muted-foreground mb-2">
          SQLite Database Admin Tool
        </p>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          A powerful, browser-based SQLite admin tool with zero server setup. 
          Run SQL queries, manage schemas, import/export databases - all in your browser.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-12">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RocketIcon className="h-5 w-5 text-primary" />
              Zero Setup
            </CardTitle>
            <CardDescription>
              No installation required. Run SQLite databases entirely in your browser using WebAssembly.
            </CardDescription>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DownloadIcon className="h-5 w-5 text-primary" />
              Offline-First
            </CardTitle>
            <CardDescription>
              Full PWA support. Install as an app and work offline with IndexedDB persistence.
            </CardDescription>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ZapIcon className="h-5 w-5 text-primary" />
              Lightning Fast
            </CardTitle>
            <CardDescription>
              Powered by Rust-compiled WASM. Experience native-like performance in the browser.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-8 mb-12">
        <Card>
          <CardHeader>
            <CardTitle>Features</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <CheckCircle2Icon className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>SQL Query Interface with syntax highlighting & autocomplete</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2Icon className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>Interactive Schema Viewer with table browser</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2Icon className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>Database Management (create, import, export, delete)</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2Icon className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>Drag-and-drop database import</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2Icon className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>Export query results to CSV/JSON</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2Icon className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>Query history & execution time tracking</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2Icon className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>Full keyboard navigation & accessibility</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2Icon className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>PWA installable on desktop & mobile</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Get Started</CardTitle>
            <CardDescription>
              Choose an option below to begin working with SQLite databases
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Link href="/db/query" className="block">
              <Button className="w-full" size="lg">
                Open Query Interface
              </Button>
            </Link>
            <Link href="/db/schema" className="block">
              <Button variant="outline" className="w-full" size="lg">
                Browse Database Schema
              </Button>
            </Link>
            <Link href="/db" className="block">
              <Button variant="outline" className="w-full" size="lg">
                Manage Databases
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      <Card className="border-primary/50 bg-primary/5">
        <CardHeader>
          <CardTitle>Technical Stack</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4 text-sm">
            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <LayoutGridIcon className="h-4 w-4 text-primary" />
                Frontend
              </h3>
              <ul className="space-y-1 text-muted-foreground">
                <li>Next.js 16 (React 19)</li>
                <li>TypeScript</li>
                <li>Tailwind CSS</li>
                <li>shadcn/ui</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <DatabaseIcon className="h-4 w-4 text-primary" />
                Database
              </h3>
              <ul className="space-y-1 text-muted-foreground">
                <li>SQLite WASM</li>
                <li>IndexedDB VFS</li>
                <li>Rust-compiled</li>
                <li>1.3MB binary</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <CodeIcon className="h-4 w-4 text-primary" />
                Editor
              </h3>
              <ul className="space-y-1 text-muted-foreground">
                <li>CodeMirror 6</li>
                <li>SQL syntax highlighting</li>
                <li>Autocomplete</li>
                <li>Keyboard shortcuts</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="text-center mt-12 text-sm text-muted-foreground">
        <p className="flex items-center justify-center gap-1.5">
          Built with <HeartIcon className="h-4 w-4 text-red-500 fill-red-500 inline" /> using modern web technologies
        </p>
        <p className="mt-2">All data stays in your browser - no server required</p>
      </div>
    </div>
  );
}
