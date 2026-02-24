import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Loader2, Mail, Lock, Trash2, ArrowLeft } from "lucide-react";

export default function Settings() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Email change
  const [newEmail, setNewEmail] = useState("");
  const [emailLoading, setEmailLoading] = useState(false);

  // Password change
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Delete account
  const [deleteLoading, setDeleteLoading] = useState(false);

  const handleEmailChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim()) return;
    setEmailLoading(true);
    const { error } = await supabase.auth.updateUser({ email: newEmail });
    setEmailLoading(false);
    if (error) {
      toast({ title: "Fel", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Klart!", description: "En bekräftelselänk har skickats till din nya e-post." });
      setNewEmail("");
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast({ title: "Fel", description: "Lösenordet måste vara minst 6 tecken.", variant: "destructive" });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: "Fel", description: "Lösenorden matchar inte.", variant: "destructive" });
      return;
    }
    setPasswordLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setPasswordLoading(false);
    if (error) {
      toast({ title: "Fel", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Klart!", description: "Lösenordet har uppdaterats." });
      setNewPassword("");
      setConfirmPassword("");
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    setDeleteLoading(true);
    try {
      const { error } = await supabase.rpc("delete_user_cascade", { p_user_id: user.id });
      if (error) throw error;
      await signOut();
      toast({ title: "Kontot raderat", description: "Ditt konto och all data har raderats permanent." });
      navigate("/auth");
    } catch (err: any) {
      toast({ title: "Fel", description: err.message || "Kunde inte radera kontot.", variant: "destructive" });
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20 p-4">
      <div className="max-w-lg mx-auto space-y-6 pt-8">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors">
          <ArrowLeft className="w-4 h-4" /> Tillbaka
        </button>

        <h1 className="text-2xl font-bold text-foreground">Inställningar</h1>
        <p className="text-sm text-muted-foreground">Inloggad som {user?.email}</p>

        {/* Email change */}
        <div className="nostalgia-card p-5 space-y-3">
          <h2 className="font-bold text-foreground flex items-center gap-2"><Mail className="w-4 h-4" /> Ändra e-post</h2>
          <form onSubmit={handleEmailChange} className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="newEmail">Ny e-postadress</Label>
              <Input id="newEmail" type="email" placeholder="ny@email.se" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} disabled={emailLoading} />
            </div>
            <Button type="submit" size="sm" disabled={emailLoading || !newEmail.trim()}>
              {emailLoading ? <><Loader2 className="w-4 h-4 mr-1 animate-spin" />Sparar...</> : "Uppdatera e-post"}
            </Button>
          </form>
        </div>

        {/* Password change */}
        <div className="nostalgia-card p-5 space-y-3">
          <h2 className="font-bold text-foreground flex items-center gap-2"><Lock className="w-4 h-4" /> Byt lösenord</h2>
          <form onSubmit={handlePasswordChange} className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="newPass">Nytt lösenord</Label>
              <Input id="newPass" type="password" placeholder="••••••••" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} disabled={passwordLoading} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="confirmPass">Bekräfta lösenord</Label>
              <Input id="confirmPass" type="password" placeholder="••••••••" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} disabled={passwordLoading} />
            </div>
            <Button type="submit" size="sm" disabled={passwordLoading || !newPassword}>
              {passwordLoading ? <><Loader2 className="w-4 h-4 mr-1 animate-spin" />Sparar...</> : "Byt lösenord"}
            </Button>
          </form>
        </div>

        {/* Delete account */}
        <div className="nostalgia-card p-5 space-y-3 border-destructive/30">
          <h2 className="font-bold text-destructive flex items-center gap-2"><Trash2 className="w-4 h-4" /> Radera konto</h2>
          <p className="text-sm text-muted-foreground">Detta raderar ditt konto och all tillhörande data permanent. Det går inte att ångra.</p>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm" disabled={deleteLoading}>
                {deleteLoading ? <><Loader2 className="w-4 h-4 mr-1 animate-spin" />Raderar...</> : "Radera mitt konto permanent"}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Är du helt säker?</AlertDialogTitle>
                <AlertDialogDescription>
                  Detta går inte att ångra. Ditt konto och all tillhörande data (meddelanden, vänner, inlägg) raderas permanent.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Avbryt</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteAccount} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  Ja, radera mitt konto
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );
}
