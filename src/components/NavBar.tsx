import { Link } from "react-router-dom";

const NavBar = () => {
  return (
    <nav className="bg-background border-b">
      <div className="container mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          <div className="text-xl font-semibold">
            <Link to="/" className="text-primary hover:text-primary/80">
              TrustDAI
            </Link>
          </div>
          <ul className="flex space-x-6">
            <li>
              <Link to="/" className="text-foreground hover:text-foreground/80">
                Home
              </Link>
            </li>
            <li>
              <Link to="/files" className="text-foreground hover:text-foreground/80">
                Files
              </Link>
            </li>
            <li>
              <Link to="/test" className="text-foreground hover:text-foreground/80">
                Test
              </Link>
            </li>
            <li>
              <Link to="/debug" className="text-foreground hover:text-foreground/80 font-medium text-blue-500">
                Debug
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default NavBar; 