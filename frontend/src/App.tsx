// src/pages/App.tsx
import { Route, Routes } from 'react-router-dom';
import SignIn from './pages/auth/Login';
import ProtectedRoute from './features/auth/ProtectedRoute';
import Register from './pages/auth/Register';
import { CanvasWrapper } from './pages/CanvasPage';

const App = () => {
  return (
    <Routes>
      <Route path="/register" element={<Register />} />
      <Route path="/login" element={<SignIn />} />
      <Route element={<ProtectedRoute />}>
        <Route path=":roomId?" element={<CanvasWrapper />} />
      </Route>
    </Routes>
  );
};

export default App;