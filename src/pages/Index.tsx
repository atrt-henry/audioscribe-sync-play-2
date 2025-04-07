
import AudioPlayer from '@/components/AudioPlayer';

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col p-4 sm:p-6 md:p-8 bg-gray-50">
      <div className="max-w-4xl w-full mx-auto">
        <AudioPlayer />
      </div>
    </div>
  );
};

export default Index;
