import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { HoopgridCheatsheetScreen } from '@/features/hoopgrid/public';
import { hoopgridReadService } from '@/features/hoopgrid/server';
import { isPhonePresentation } from '@/lib/mobile/presentation-server';

export const metadata = {
  title: 'Hoopgrid Cheatsheet | Euroleague Biwenger Stats',
  description: 'Soluciones y combinaciones de criterios para el desafío Hoopgrid.',
};

export default async function HoopgridCheatsheetPage({ searchParams }) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/login?callbackUrl=%2Fhoopgrid-cheatsheet');
  }

  const phone = await isPhonePresentation();
  const params = await searchParams;
  const dateParam = typeof params?.date === 'string' ? params.date : undefined;

  const data = await hoopgridReadService.getCheatsheetData(dateParam);

  if (!data) {
    const today = new Date().toISOString().split('T')[0];
    const targetDate = dateParam || today;
    return (
      <div className="p-20 text-center bg-background min-h-screen text-foreground">
        <h1 className="text-2xl font-bold">No challenge found for {targetDate}</h1>
        <a href="/hoopgrid-cheatsheet" className="text-primary hover:underline mt-4 inline-block">
          Return to Today
        </a>
      </div>
    );
  }

  return <HoopgridCheatsheetScreen data={data} phone={phone} />;
}
