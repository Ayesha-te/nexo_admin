import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { ReactNode, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";

export function DashboardLayout({ children }: { children: ReactNode }) {
  const { logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [feedbackName, setFeedbackName] = useState("");
  const [feedbackMessage, setFeedbackMessage] = useState("");

  const handleSignOut = () => {
    logout();
    navigate("/login");
  };

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackName || !feedbackMessage) {
      toast({ title: "Error", description: "Please fill your name and message", variant: "destructive" });
      return;
    }
    try {
      await api("/api/complaints/me/", {
        method: "POST",
        body: JSON.stringify({ message: feedbackMessage, type: "feedback" }),
      });
      toast({ title: "Submitted", description: "Your feedback/complaint has been submitted." });
      setFeedbackName("");
      setFeedbackMessage("");
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Submission failed", variant: "destructive" });
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-h-screen">
          <header className="h-14 flex items-center border-b border-border bg-card px-4 sticky top-0 z-30">
            <SidebarTrigger className="mr-4 relative z-50 md:h-7 md:w-7 h-9 w-9" />
            <img
              src="/ChatGPT_Image_Mar_3__2026__02_42_58_PM-removebg-preview.png"
              alt="Nexocart"
              className="h-12 w-auto"
            />
            <div className="flex-1" />
            <Button variant="outline" size="sm" onClick={handleSignOut}>Sign Out</Button>
          </header>
          <main className="flex-1 p-6 overflow-auto">
            {children}

            {!isAdmin && (
              <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="rounded-xl border border-border bg-card p-5">
                  <h3 className="font-display text-lg font-semibold text-foreground">Contact Us</h3>
                  <div className="mt-3 space-y-2 text-sm text-muted-foreground">
                    <p><span className="font-semibold text-foreground">Phone:</span> 03448252109</p>
                    <p><span className="font-semibold text-foreground">Phone:</span> 03057410110</p>
                    <p><span className="font-semibold text-foreground">Email:</span> sardarlaeiq786@gmail.com</p>
                    <p><span className="font-semibold text-foreground">Location:</span> Sargodha</p>
                  </div>
                </div>

                <div className="rounded-xl border border-border bg-card p-5">
                  <h3 className="font-display text-lg font-semibold text-foreground">Feedback & Complaints</h3>
                  <form className="mt-3 space-y-3" onSubmit={handleFeedbackSubmit}>
                    <div className="space-y-1">
                      <Label>Your Name</Label>
                      <Input value={feedbackName} onChange={(e) => setFeedbackName(e.target.value)} placeholder="Enter your name" />
                    </div>
                    <div className="space-y-1">
                      <Label>Message</Label>
                      <Textarea
                        value={feedbackMessage}
                        onChange={(e) => setFeedbackMessage(e.target.value)}
                        placeholder="Write your feedback or complaint"
                        rows={4}
                      />
                    </div>
                    <Button type="submit" className="nexo-gradient text-primary-foreground">Submit</Button>
                  </form>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
