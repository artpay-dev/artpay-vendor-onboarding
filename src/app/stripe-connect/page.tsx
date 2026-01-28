'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { CheckCircle2, Clock, XCircle, CreditCard, ExternalLink, Loader2, LogIn } from 'lucide-react';

interface StripeAccountStatus {
  connected: boolean;
  account_id?: string;
  charges_enabled?: boolean;
  payouts_enabled?: boolean;
  details_submitted?: boolean;
}

export default function StripeConnectPage() {
  const [loading, setLoading] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [accountStatus, setAccountStatus] = useState<StripeAccountStatus | null>(null);
  const [needsAuth, setNeedsAuth] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authData, setAuthData] = useState({
    username: '',
    password: '',
  });

  const getAuthHeader = (): string | null => {
    if (typeof window === 'undefined') return null;
    return sessionStorage.getItem('vendor_auth');
  };

  useEffect(() => {
    // Controlla se ci sono credenziali salvate
    const auth = getAuthHeader();
    const username = sessionStorage.getItem('vendor_username');
    const password = sessionStorage.getItem('vendor_password');

    if (!auth) {
      // Se abbiamo username/password salvati, pre-popola il form e tenta il login automatico
      if (username && password) {
        setAuthData({ username, password });
        // Tenta login automatico
        const credentials = btoa(`${username}:${password}`);
        sessionStorage.setItem('vendor_auth', credentials);

        // Pulisci la password dopo averla usata
        sessionStorage.removeItem('vendor_password');

        void checkAccountStatus();
      } else {
        setNeedsAuth(true);
        setCheckingStatus(false);
      }
    } else {
      void checkAccountStatus();
    }
  }, []);

  const handleLogin = async () => {
    setAuthLoading(true);

    try {
      // Crea le credenziali Basic Auth
      const credentials = btoa(`${authData.username}:${authData.password}`);

      console.log('Attempting login with username:', authData.username);

      // Test le credenziali con una chiamata API
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_ARTPAY_SERVER_URL}/wp-json/artpay/v1/stripe-connect/status`,
        {
          method: 'GET',
          headers: {
            Authorization: `Basic ${credentials}`,
          },
        }
      );

      console.log('Login response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        console.error('Login failed:', response.status, errorData);

        if (response.status === 401 || response.status === 403) {
          throw new Error('Username o password non validi');
        }
        throw new Error(errorData?.message || 'Errore durante il login');
      }

      const data = await response.json();
      console.log('Login successful, account status:', data);

      // Salva le credenziali in sessionStorage
      sessionStorage.setItem('vendor_auth', credentials);
      sessionStorage.setItem('vendor_username', authData.username);

      setNeedsAuth(false);
      setAccountStatus(data);

      toast.success('Login effettuato!', {
        description: 'Accesso completato con successo.',
      });
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Errore di login', {
        description: error instanceof Error ? error.message : 'Credenziali non valide.',
      });
    } finally {
      setAuthLoading(false);
    }
  };

  const checkAccountStatus = async () => {
    setCheckingStatus(true);
    const auth = getAuthHeader();

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_ARTPAY_SERVER_URL}/wp-json/artpay/v1/stripe-connect/status`,
        {
          method: 'GET',
          headers: auth ? {
            Authorization: `Basic ${auth}`,
          } : {},
        }
      );

      if (response.ok) {
        const data = await response.json();
        setAccountStatus(data);
      } else if (response.status === 401 || response.status === 403) {
        // Credenziali non valide, rimuovi auth e mostra login
        sessionStorage.removeItem('vendor_auth');
        sessionStorage.removeItem('vendor_password');
        setNeedsAuth(true);

        const errorData = await response.json().catch(() => null);
        console.error('Auth error:', response.status, errorData);

        toast.error('Autenticazione richiesta', {
          description: 'Le credenziali non sono valide. Effettua nuovamente il login.',
        });
      } else {
        const errorData = await response.json().catch(() => null);
        console.error('API error:', response.status, errorData);
      }
    } catch (error) {
      console.error('Error checking account status:', error);
      toast.error('Errore di connessione', {
        description: 'Impossibile verificare lo stato dell\'account. Riprova.',
      });
    } finally {
      setCheckingStatus(false);
    }
  };

  const handleConnect = async () => {
    setLoading(true);
    const auth = getAuthHeader();

    if (!auth) {
      setNeedsAuth(true);
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_ARTPAY_SERVER_URL}/wp-json/artpay/v1/stripe-connect/account-link`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Basic ${auth}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || 'Errore durante la connessione a Stripe');
      }

      const data = await response.json();

      if (data.url) {
        toast.success('Reindirizzamento a Stripe...', {
          description: 'Completa il processo di onboarding su Stripe.',
        });
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Connection error:', error);
      toast.error('Errore di connessione', {
        description: error instanceof Error ? error.message : 'Si è verificato un errore. Riprova.',
      });
      setLoading(false);
    }
  };

  const handleDashboard = async () => {
    const auth = getAuthHeader();

    if (!auth) {
      setNeedsAuth(true);
      return;
    }

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_ARTPAY_SERVER_URL}/wp-json/artpay/v1/stripe-connect/login-link`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Basic ${auth}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Errore durante l\'accesso alla dashboard');
      }

      const data = await response.json();

      if (data.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      toast.error('Errore', {
        description: error instanceof Error ? error.message : 'Impossibile accedere alla dashboard.',
      });
    }
  };

  const getStatusBadge = () => {
    if (checkingStatus) {
      return (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          <span className="text-sm">Verifica stato...</span>
        </div>
      );
    }

    if (!accountStatus?.connected) {
      return (
        <div className="flex items-center gap-2 text-muted-foreground">
          <XCircle className="size-5" />
          <span className="text-sm font-medium">Account non connesso</span>
        </div>
      );
    }

    if (accountStatus.charges_enabled && accountStatus.payouts_enabled) {
      return (
        <div className="flex items-center gap-2 text-success">
          <CheckCircle2 className="size-5" />
          <span className="text-sm font-medium">Account attivo</span>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-2 text-info">
        <Clock className="size-5" />
        <span className="text-sm font-medium">Azione richiesta</span>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="container mx-auto px-6">
        <div className="w-full max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="font-heading text-4xl font-medium mb-2">Connetti Stripe</h1>
            <p className="text-muted-foreground">
              Configura il tuo account per ricevere pagamenti direttamente
            </p>
          </div>

          <div className="space-y-6">
            {/* Login Card */}
            {needsAuth && (
              <Card>
                <CardHeader>
                  <CardTitle className="font-heading flex items-center gap-2">
                    <LogIn className="size-5" />
                    Accedi per continuare
                  </CardTitle>
                  <CardDescription>
                    Inserisci le tue credenziali per configurare Stripe Connect
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="username">Username</Label>
                      <Input
                        id="username"
                        type="text"
                        placeholder="Nome utente"
                        value={authData.username}
                        onChange={(e) => setAuthData({ ...authData, username: e.target.value })}
                        disabled={authLoading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <Input
                        id="password"
                        type="password"
                        placeholder="Password"
                        value={authData.password}
                        onChange={(e) => setAuthData({ ...authData, password: e.target.value })}
                        disabled={authLoading}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            void handleLogin();
                          }
                        }}
                      />
                    </div>
                    <Button
                      onClick={handleLogin}
                      disabled={authLoading || !authData.username || !authData.password}
                      className="w-full"
                      size="lg"
                    >
                      {authLoading ? (
                        <>
                          <Loader2 className="size-4 animate-spin" />
                          Accesso in corso...
                        </>
                      ) : (
                        <>
                          <LogIn className="size-4" />
                          Accedi
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Account Status Card */}
            {!needsAuth && accountStatus?.connected && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="font-heading">Stato Account</CardTitle>
                    {getStatusBadge()}
                  </div>
                  <CardDescription>
                    Account ID: {accountStatus.account_id}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Pagamenti abilitati</span>
                      {accountStatus.charges_enabled ? (
                        <CheckCircle2 className="size-5 text-success" />
                      ) : (
                        <XCircle className="size-5 text-destructive" />
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Bonifici abilitati</span>
                      {accountStatus.payouts_enabled ? (
                        <CheckCircle2 className="size-5 text-success" />
                      ) : (
                        <XCircle className="size-5 text-destructive" />
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Dati completati</span>
                      {accountStatus.details_submitted ? (
                        <CheckCircle2 className="size-5 text-success" />
                      ) : (
                        <XCircle className="size-5 text-destructive" />
                      )}
                    </div>
                  </div>
                  <div className="mt-6">
                    <Button
                      onClick={handleDashboard}
                      variant="outline"
                      className="w-full"
                    >
                      <ExternalLink className="size-4" />
                      Accedi a Stripe Dashboard
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Instructions Card */}
            {!needsAuth && (
            <Card>
              <CardHeader>
                <CardTitle className="font-heading">Come funziona</CardTitle>
                <CardDescription>
                  Segui questi passaggi per connettere il tuo account Stripe
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ol className="space-y-3">
                  <li className="flex gap-3">
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
                      1
                    </span>
                    <span className="text-sm">Clicca sul pulsante &quot;Connetti Stripe&quot; qui sotto</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
                      2
                    </span>
                    <span className="text-sm">Verrai reindirizzato a Stripe per completare l&apos;onboarding</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
                      3
                    </span>
                    <span className="text-sm">Compila i dati richiesti (informazioni azienda, dati fiscali, coordinate bancarie)</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
                      4
                    </span>
                    <span className="text-sm">Dopo il completamento, sarai reindirizzato alla dashboard</span>
                  </li>
                </ol>
              </CardContent>
            </Card>
            )}

            {/* Commission Info Card */}
            {!needsAuth && (
            <Card>
              <CardHeader>
                <CardTitle className="font-heading flex items-center gap-2">
                  <CreditCard className="size-5" />
                  Sistema di Commissioni
                </CardTitle>
                <CardDescription>
                  Le commissioni variano in base alla tua anzianità sulla piattaforma
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-muted p-6 rounded-lg space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">0-6 mesi</p>
                      <p className="text-sm text-muted-foreground">Primi 6 mesi come vendor</p>
                    </div>
                    <span className="text-2xl font-bold text-primary">6%</span>
                  </div>
                  <div className="h-px bg-border" />
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Oltre 6 mesi</p>
                      <p className="text-sm text-muted-foreground">Dopo 6 mesi di attività</p>
                    </div>
                    <span className="text-2xl font-bold text-primary">12%</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-4">
                  La commissione si calcola sul prezzo del prodotto esclusa IVA. L&apos;IVA viene sempre trasferita interamente a te.
                </p>
              </CardContent>
            </Card>
            )}

            {/* Payment Info Card */}
            {!needsAuth && (
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>
                    <strong className="text-foreground">Metodi di pagamento supportati:</strong> Carte di credito/debito (Visa, Mastercard, American Express) e Klarna
                  </p>
                  <p>
                    <strong className="text-foreground">Tempistiche pagamenti:</strong> 2-7 giorni lavorativi dal momento dell&apos;ordine
                  </p>
                </div>
              </CardContent>
            </Card>
            )}

            {/* Connect Button */}
            {!needsAuth && (
              <Button
                onClick={handleConnect}
                disabled={loading || checkingStatus}
                size="lg"
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Connessione in corso...
                  </>
                ) : (
                  <>
                    <CreditCard className="size-4" />
                    {accountStatus?.connected ? 'Aggiorna Connessione Stripe' : 'Connetti Stripe'}
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}