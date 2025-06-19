import React, { useEffect, useState } from 'react';
import bg from '../../assets/bg.png';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../features/auth/AuthProvider';
import axios from 'axios';
import { apiRoutes } from '../../lib/apiRoutes';

const Register: React.FC = () => {
  const navigate = useNavigate();
  const { authenticated, login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  useEffect(() => {
    if (authenticated) navigate('/');
  }, [authenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await axios.post(apiRoutes.auth.register, { email, password });
      navigate('/login');
    } catch (err) {
      console.error('Login failed', err);
      setError(true);
    }
  };

  return (
    <div className="flex h-screen md:flex-row flex-col">
      <div className="md:w-2/3 lg:w-1/3 flex bg-neutral-900 flex-col justify-center items-center z-10 border-r border-neutral-700 p-4">
        <form className="w-full max-w-sm" onSubmit={handleSubmit}>
          <h1 className="text-3xl font-semibold text-white mb-10">Sign in</h1>

          <div className="mb-4">
            <label className="block text-neutral-300 text-sm mb-2" htmlFor="email">
              Email
            </label>
            <input
              className="shadow appearance-none border rounded w-full py-2 px-3 text-neutral-300 leading-tight focus:outline-none focus:shadow-outline bg-neutral-800 border-neutral-700"
              id="email"
/*                type="email"
 */               value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="mb-6">
            <label className="block text-neutral-300 text-sm mb-2" htmlFor="password">
              Password
            </label>
            <input
              className="shadow appearance-none border rounded w-full py-2 px-3 text-neutral-300 leading-tight focus:outline-none focus:shadow-outline bg-neutral-800 border-neutral-700"
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && <p className="text-red-500 text-sm mb-4">Invalid credentials. Try again.</p>}

          <div
            className="text-white flex flex-row gap-2 rounded focus:outline-none justify-center focus:shadow-outline mb-6"
          >
            Already have an account?
            <Link to={"/login"}>
              <button className='underline text-blue-400 cursor-pointer hover:text-blue-300' type='submit'>
                Login
              </button>
            </Link>
          </div>

          <button
            className="bg-blue-700 hover:bg-blue-500 text-white py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full"
            type="submit"
          >
            Sign up
          </button>
        </form>
      </div>

      <div className="md:w-2/3 bg-neutral-950 md:block hidden">
        <img src={bg} alt="Background" className="object-cover h-full w-full opacity-25 blur-lg" />
      </div>
    </div>
  );
};

export default Register;
