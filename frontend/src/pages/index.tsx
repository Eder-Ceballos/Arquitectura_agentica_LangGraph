import { FileUpload } from '../components/FileUpload';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-10 rounded-2xl shadow-xl">
        <h1 className="text-2xl font-bold mb-6 text-center">IAGentes - Entrega 2</h1>
        {/* Aquí invocamos tu componente */}
        <FileUpload />
      </div>
    </div>
  );
}
