import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes"; // Add this
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { Dashboard } from "./pages/OktoDashboard";


function App (){
  return(
      <ThemeProvider attribute="class" defaultTheme="dark"> {/* Set dark as default */}
        <TooltipProvider>
          <Toaster />
          <Sonner />
          
              <BrowserRouter>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/okto" element={<Dashboard/>}/>                    
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </BrowserRouter>
            
        </TooltipProvider>
      </ThemeProvider>
  );
}

export default App;