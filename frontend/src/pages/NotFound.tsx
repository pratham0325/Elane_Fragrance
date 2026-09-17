import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <section className="min-h-[70vh] flex flex-col items-center justify-center px-6 pt-32 text-center">
      <p className="uppercase tracking-widest2 text-gold text-xs mb-4">404</p>
      <h1 className="font-display text-4xl mb-4">This scent has left the shelf.</h1>
      <Link to="/" className="underline underline-offset-4 text-sm">
        Return to the collection
      </Link>
    </section>
  );
}
