import LoginButton from '@/components/auth/LoginButton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Waves } from 'lucide-react'; // Using an existing icon that fits the theme

export default function HomePage() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <div className="flex justify-center items-center mb-4">
            <Waves size={48} className="text-primary" />
          </div>
          <CardTitle className="text-3xl font-headline text-primary">Repo Surfer</CardTitle>
          <CardDescription className="text-muted-foreground pt-2">
            Sign in to explore your GitHub repositories.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center space-y-6 pt-2 pb-6">
          <LoginButton />
        </CardContent>
      </Card>
      <footer className="mt-8 text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} Repo Surfer. Ride the code wave!</p>
      </footer>
    </main>
  );
}
