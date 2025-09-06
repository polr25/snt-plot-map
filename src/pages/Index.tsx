import { PlotMap } from '@/components/PlotMap';

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold mb-4">СНТ "Участки"</h1>
          <p className="text-xl text-muted-foreground">Интерактивная карта участков садового товарищества</p>
        </div>
        <PlotMap />
      </div>
    </div>
  );
};

export default Index;
