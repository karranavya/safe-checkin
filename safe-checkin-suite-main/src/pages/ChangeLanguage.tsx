
import { Button } from '@/components/ui/button';

const ChangeLanguagePage = () => {
  const languages = ['English', 'Hindi', 'Telugu'];

  return (
    <div className="flex flex-col items-center justify-center h-full space-y-6">
      <h1 className="text-3xl font-bold">Change Language</h1>
      <p className="text-muted-foreground">Select your preferred language.</p>
      <div className="flex gap-4">
        {languages.map((lang) => (
          <Button key={lang} variant="outline" size="lg">
            {lang}
          </Button>
        ))}
      </div>
    </div>
  );
};

export default ChangeLanguagePage;
