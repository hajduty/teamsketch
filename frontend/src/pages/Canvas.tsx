import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Canvas, CanvasRef } from "../features/canvas/Canvas";
import { Toolbar } from "../features/canvas/components/Toolbar";
import { ToolOptions } from "../features/canvas/components/ToolOptions";
import { HistoryButtons } from "../features/canvas/components/HistoryButtons";
import FpsCounter from "../features/canvas/components/FpsCounter";
import { ShareCanvas } from "../features/canvas/components/ShareCanvas";
import { useAuth } from "../features/auth/AuthProvider";
import apiClient from "../lib/apiClient";
import { apiRoutes } from "../lib/apiRoutes";
import { Permissions } from "../types/permission";

function App() {
  const { roomId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [role, setRole] = useState<string>("");
  const [name, setName] = useState<string>("");
  const [enteredName, setEnteredName] = useState<boolean>(false);

  const canvasRef = useRef<CanvasRef>(null);
  const [tool, setTool] = useState<string>("pen");
  const [permissions, setPermissions] = useState<Permissions[]>([]);

  useEffect(() => {
    if (!roomId) {
      const newRoomId = crypto.randomUUID();
      navigate(`/${newRoomId}`, { replace: true });
    }
  }, [roomId, navigate]);

  useEffect(() => {
    if (canvasRef.current) {
      canvasRef.current.setTool(tool);
    }
  }, [tool]);

  const fetchPermissions = async () => {
    if (!roomId || !user?.email) return;

    try {
      const response = await apiClient.get(apiRoutes.permission.getByRoom(roomId));
      const data: Permissions[] = response.data;
      setPermissions(data);

      // Find permission for the current user
      const myPermission = data.find(p => p.userEmail === user.email);
      if (myPermission) {
        setRole(myPermission.role);
        //console.log("OUR ROLE IS", myPermission.role);
      }
    } catch (err: any) {
      console.error("Fetch permissions failed", err);
    }
  };

  useEffect(() => {
    if (!roomId) return;

    fetchPermissions();

    const intervalId = setInterval(() => {
      fetchPermissions();
    }, 5000);

    return () => {
      clearInterval(intervalId);
    };
  }, [roomId]);

  if (!enteredName) {
    return (
      <div className="bg-white-900 mt-16">
        <div className="pt-44 text-center h-72 flex flex-col gap-2">
          <h1 className="text-5xl text-center select-none">TeamSketch</h1>
          <p className="text-sm font-light text-center select-none">Real-time sketch collaboration</p>
        </div>
        <div className="flex flex-row h-60 justify-center items-center gap-2 font-light">
          <input
            type="text"
            placeholder="Display name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="rounded-sm decoration-0 outline-0 text-black p-2 border-2 border-gray-950"
          />
          <button
            type="button"
            className="px-4 p-2 rounded-md bg-black cursor-pointer text-white"
            onClick={() => setEnteredName(true)}
          >
            Start
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {role != "viewer" && <>
        <HistoryButtons canvasRef={canvasRef} />
        <Toolbar tool={tool} setTool={setTool} />
        <ToolOptions tool={tool} canvasRef={canvasRef} />
        <ShareCanvas roomId={roomId!} />
        <FpsCounter />
      </>
      }
      <div className="flex flex-row h-screen justify-center items-center bg-neutral-800 relative">
        <Canvas ref={canvasRef} name={name} roomId={roomId!} role={role} />
      </div>
    </>
  );
}

export default App;
