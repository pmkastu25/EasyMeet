import logo from './logo.svg';
import './App.css';
import {BrowserRouter as Router, Routes, Route} from "react-router-dom"
import LandingPage from './pages/landing';
import Authentication from './pages/authentication.jsx';
import { AuthProvider } from './contents/AuthContext.jsx';

function App() {
  return (
   <>
    <Router>
      <AuthProvider>
      <Routes>
        {/* <Route path="/home" /> */}
        <Route path="/" element={<LandingPage/>} />
        <Route path="/auth" element={<Authentication />}/>
      </Routes>
      </AuthProvider>
    </Router>
   </>
  );
}

export default App;
