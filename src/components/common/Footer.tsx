import { Link } from 'react-router-dom'

export function Footer() {
  return (
    <footer className="w-full border-t bg-white/50 py-6 mt-8">
      <div className="container mx-auto px-6 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} Paris Janitor</p>
        <div className="flex items-center gap-4">
          <Link to="/privacy" className="text-sm text-muted-foreground hover:text-foreground">Privacy</Link>
        </div>
      </div>
    </footer>
  )
}

export default Footer
