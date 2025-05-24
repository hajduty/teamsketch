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
import { CanvasList } from "../features/canvas/components/CanvasList";

function App() {
  const { roomId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [permission, setPermission] = useState<Permissions>();
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
        setPermission(myPermission);
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

  return (
    <>
      {permission?.role != "viewer" && <>
        <HistoryButtons canvasRef={canvasRef} />
        <Toolbar tool={tool} setTool={setTool} />
        <ToolOptions tool={tool} canvasRef={canvasRef} />
        <ShareCanvas roomId={roomId!} />
      </>
      }
      <CanvasList/>
      <div className="flex flex-row h-screen justify-center items-center bg-neutral-800 relative">
        <Canvas ref={canvasRef} roomId={roomId!} role={permission?.role}/>
      </div>
    </>
  );
}

export default App;
