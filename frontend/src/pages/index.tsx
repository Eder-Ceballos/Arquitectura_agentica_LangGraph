import { useRouter } from 'next/router';
import { useMagneto } from '../context/MagnetoContext';
import { FileUpload } from './FileUpload';

export default function Home() {
  const router = useRouter();
  const { setState } = useMagneto();

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <FileUpload
        onSuccess={(data) => {
          console.log("Llegó a onSuccess de Home con:", data);
          setState(data);
          if (data.es_valido === true) {
            router.push('/Profile');
          } else {
            router.push('/FormUser');
          }
        }}
      />
    </div>
  );
}