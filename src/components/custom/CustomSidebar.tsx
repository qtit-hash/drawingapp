'use client'

import { useState, useEffect } from 'react'
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarHeader} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Plus, Undo2, Redo2, Settings2, ChevronDown, X, FileText, ChevronRight, Download } from 'lucide-react'
import { cn } from "@/lib/utils"
import MathInput from './MathInput'
import "//unpkg.com/mathlive"
import { ComputeEngine } from '@cortex-js/compute-engine'

interface MathEquation {
  id: number
  equation: string
  type: 'linear' | 'quadratic'
  result?: string
  variables?: { [key: string]: number }
}

interface Page {
  id: number
  name: string
}

interface CustomSidebarProps {
  equations: MathEquation[]
  selectedId: number
  setSelectedId: (id: number) => void
  handleRemove: (id: number) => void
  pages: Page[]
  activePage: number | null
  onPageChange: (pageId: number) => void
  onAddPage: () => void
  onRemovePage: (pageId: number) => void
}

const ce = new ComputeEngine()

const detectAndAddVariables = (equation: string, existingVariables: { [key: string]: number }) => {
  const mathFunctions = ['sin', 'cos', 'tan', 'log', 'ln'];
  let cleanEquation = equation;
  
  mathFunctions.forEach(func => {
    cleanEquation = cleanEquation.replace(new RegExp(func, 'g'), '');
  });
  
  const variableRegex = /(?:^|[^a-zA-Z])[a-zA-Z](?:$|[^a-zA-Z])/g;
  const matches = cleanEquation.match(variableRegex) || [];
  const detectedVariables = [...new Set(matches.map(match => match.trim().match(/[a-zA-Z]/)?.[0] || ''))];
  
  const updatedVariables = { ...existingVariables };
  detectedVariables.forEach(variable => {
    if (variable && !(variable in updatedVariables)) {
      updatedVariables[variable] = 0;
    }
  });
  
  Object.keys(updatedVariables).forEach(key => {
    if (!detectedVariables.includes(key)) {
      delete updatedVariables[key];
    }
  });
  
  return updatedVariables;
}

async function calculateResult(equation: string, variables?: { [key: string]: number }): Promise<string> {
  try {
    const expr = ce.parse(equation);
    const result = await expr.evaluate(variables);
    return result.latex;
  } catch (error) {
    console.error('Error calculating result:', error);
    return 'Error';
  }
}

export default function CustomSidebar({ 
  equations, 
  selectedId, 
  setSelectedId, 
  pages,
  activePage,
  onPageChange,
  onAddPage,
  onRemovePage
}: CustomSidebarProps) {
  const [localEquations, setLocalEquations] = useState(equations)

  useEffect(() => {
    setLocalEquations(equations);
  }, [equations]);

  const updateEquation = async (id: number, newEquation: string) => {
    setLocalEquations(await Promise.all(localEquations.map(async eq => {
      if (eq.id === id) {
        const updatedVariables = detectAndAddVariables(newEquation, eq.variables || {});
        const updatedEq = { ...eq, equation: newEquation, variables: updatedVariables };
        updatedEq.result = await calculateResult(newEquation, updatedEq.variables);
        return updatedEq;
      }
      return eq;
    })));
  }

  const addEquation = () => {
    const newId = Math.max(0, ...localEquations.map(eq => eq.id)) + 1
    setLocalEquations([...localEquations, { 
      id: newId, 
      equation: '', 
      type: 'linear',
      variables: {},
      result: ''
    }])
    setSelectedId(newId)
  }

  const handleRemove = (id: number) => {
    setLocalEquations(prevEquations => prevEquations.filter(eq => eq.id !== id));
    if (selectedId === id) {
      const remainingEquations = localEquations.filter(eq => eq.id !== id);
      setSelectedId(remainingEquations[0]?.id || 0);
    }
  }

  const updateVariable = async (id: number, variable: string, value: number) => {
    setLocalEquations(await Promise.all(localEquations.map(async eq => {
      if (eq.id === id) {
        const updatedVariables = { ...eq.variables, [variable]: value }
        const updatedEq = { ...eq, variables: updatedVariables }
        updatedEq.result = await calculateResult(eq.equation, updatedVariables)
        return updatedEq
      }
      return eq
    })))
  }

  const exportLatex = () => {
    const latex = localEquations.map(eq => eq.equation).join('\n');
    const blob = new Blob([latex], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'equations.tex';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <Sidebar>
      <SidebarHeader className="border-b px-2 py-2">
        <div className="flex items-center gap-1 px-2">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={addEquation}>
            <Plus className="h-4 w-4" />
            <span className="sr-only">Add equation</span>
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Undo2 className="h-4 w-4" />
            <span className="sr-only">Undo</span>
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Redo2 className="h-4 w-4" />
            <span className="sr-only">Redo</span>
          </Button>
          <div className="flex-1" />
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={exportLatex}>
            <Download className="h-4 w-4" />
            <span className="sr-only">Export LaTeX</span>
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Settings2 className="h-4 w-4" />
            <span className="sr-only">Settings</span>
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ChevronDown className="h-4 w-4" />
            <span className="sr-only">Collapse sidebar</span>
          </Button>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <Collapsible>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between">
              Pages
              <ChevronRight className="h-4 w-4" />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <SidebarGroup>
              <SidebarGroupContent>
                <div className="space-y-2 p-2">
                  {pages.map((page) => (
                    <div key={page.id} className="flex items-center justify-between">
                      <Button
                        variant={activePage === page.id ? "secondary" : "ghost"}
                        size="sm"
                        className="w-full justify-start"
                        onClick={() => onPageChange(page.id)}
                      >
                        <FileText className="mr-2 h-4 w-4" />
                        {page.name}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => onRemovePage(page.id)}
                      >
                        <X className="h-4 w-4" />
                        <span className="sr-only">Remove page</span>
                      </Button>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={onAddPage}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add new page
                  </Button>
                </div>
              </SidebarGroupContent>
            </SidebarGroup>
          </CollapsibleContent>
        </Collapsible>
        
        <div className="flex-1 overflow-auto">
          {localEquations.map((eq, index) => (
            <div
              key={eq.id}
              className={cn(
                "group relative flex flex-col cursor-pointer px-4 py-2 hover:bg-accent",
                selectedId === eq.id && "bg-white"
              )}
              onClick={() => setSelectedId(eq.id)}
            >
              <div className="flex items-center gap-3 flex-1">
                <span className="text-sm text-muted-foreground">{index + 1}</span>
                <div className="flex items-center gap-2 flex-1">
                  <div 
                    className={cn(
                      "h-6 w-6 rounded-full transition-colors duration-200",
                      "group-focus-within:bg-blue-600 bg-blue-500"
                    )} 
                  />
                  <div className="relative flex-1">
                    <MathInput
                      initialValue={eq.equation}
                      onChange={(value) => updateEquation(eq.id, value)}
                    />
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemove(eq.id);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              {eq.variables && Object.entries(eq.variables).map(([variable, value]) => (
                <div key={variable} className="flex items-center gap-2 mt-2">
                  <span className="text-sm">{variable} =</span>
                  <input
                    type="number"
                    value={value}
                    onChange={(e) => updateVariable(eq.id, variable, parseFloat(e.target.value))}
                    className="w-20 p-1 border rounded"
                  />
                </div>
              ))}
              {eq.result && (
                <div className="mt-2 text-sm font-medium">
                  Result: <math-field read-only>{eq.result}</math-field>
                </div>
              )}
            </div>
          ))}
        </div>
      </SidebarContent>
    </Sidebar>
  )
}

