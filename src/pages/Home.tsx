'use client'

import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Footer from "@/components/custom/Footer"
import SketchCanvas from "@/components/custom/SketchCanvas"
import Toolbar from "@/components/custom/Toolbar"
import { useStrokesStore } from "@/store/strokesStore"
import { SidebarProvider } from "@/components/ui/sidebar"
import CustomSidebar from '@/components/custom/CustomSidebar'

interface MathEquation {
  id: number
  equation: string
  type: 'linear' | 'quadratic'
}

interface Page {
  id: number
  name: string
  strokes: any[] // Replace 'any' with your actual Stroke type from strokesStore
}

const SketchView = () => {
  const [pages, setPages] = useState<Page[]>([])
  const [activePage, setActivePage] = useState<number | null>(null)
  const { strokes, setStrokes } = useStrokesStore()

  const [equations, setEquations] = React.useState<MathEquation[]>([
    { id: 1, equation: '2x + y = 0', type: 'linear' },
    { id: 2, equation: '2x²', type: 'quadratic' },
  ])
  
  const [selectedId, setSelectedId] = React.useState(3)

  useEffect(() => {
    // Load pages from local storage on component mount
    const savedPages = localStorage.getItem('sketchPages')
    if (savedPages) {
      setPages(JSON.parse(savedPages))
    } else {
      // If no saved pages, create an initial page
      createNewPage()
    }
  }, [])

  useEffect(() => {
    // Save pages to local storage whenever they change
    localStorage.setItem('sketchPages', JSON.stringify(pages))
  }, [pages])

  useEffect(() => {
    // Update the active page's strokes when strokes change
    if (activePage !== null) {
      setPages(prevPages => 
        prevPages.map(page => 
          page.id === activePage ? { ...page, strokes } : page
        )
      )
    }
  }, [strokes, activePage])

  const createNewPage = () => {
    const newPage: Page = {
      id: pages.length + 1,
      name: `Page ${pages.length + 1}`,
      strokes: []
    }
    setPages(prevPages => [...prevPages, newPage])
    setActivePage(newPage.id)
    setStrokes([])
  }

  const handlePageChange = (pageId: number) => {
    setActivePage(pageId)
    const page = pages.find(p => p.id === pageId)
    if (page) {
      setStrokes(page.strokes)
    }
  }

  const handleRemovePage = (pageId: number) => {
    if (pages.length > 1) {
      setPages(prevPages => prevPages.filter(page => page.id !== pageId))
      if (activePage === pageId) {
        const newActivePage = pages.find(page => page.id !== pageId)
        if (newActivePage) {
          setActivePage(newActivePage.id)
          setStrokes(newActivePage.strokes)
        }
      }
    } else {
      alert("Cannot remove the last page.")
    }
  }

  const handleRemove = (id: number) => {
    setEquations(equations.filter(eq => eq.id !== id))
  }

  return (
    <div className="flex h-[100vh] overflow-hidden font-sans">
      <SidebarProvider>
        <CustomSidebar 
          equations={equations}
          selectedId={selectedId}
          setSelectedId={setSelectedId}
          handleRemove={handleRemove}
          pages={pages}
          activePage={activePage}
          onPageChange={handlePageChange}
          onAddPage={createNewPage}
          onRemovePage={handleRemovePage}
        />
        <div className="flex-1 relative">
          <div className="h-[100%] relative">
            {activePage !== null && <SketchCanvas key={activePage} />}
          </div>
          <div className="absolute flex justify-center w-full top-0">
            <Toolbar />
          </div>
          <div className="absolute flex justify-between w-full bottom-0">
            <Footer />
          </div>
        </div>
      </SidebarProvider>
    </div>
  )
}

const Home = () => {
  return (
    <Router>
      <Routes>
        <Route path="/drawingapp" element={<SketchView />} />
      </Routes>
    </Router>
  )
}

export default Home