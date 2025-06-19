// src/pages/App.tsx
import { Route, Routes } from 'react-router-dom';
import Canvas from './pages/Canvas';
import SignIn from './pages/auth/Login';
import ProtectedRoute from './features/auth/ProtectedRoute';
import Register from './pages/auth/Register';

const App = () => {
  return (
    <Routes>
      <Route path="/register" element={<Register />} />
      <Route path="/login" element={<SignIn />} />
      <Route path="/:roomId" element={<ProtectedRoute> <Canvas /> </ProtectedRoute>} />
      <Route
        path="/"
        element={<ProtectedRoute> <Canvas /> </ProtectedRoute>}
      />
    </Routes>
  );
};

export default App;