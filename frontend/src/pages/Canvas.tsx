import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Canvas } from "../features/canvas/Canvas";
import { Toolbar } from "../features/canvas/components/Toolbar";
import { ToolOptions } from "../features/canvas/components/ToolOptions";
import { HistoryButtons } from "../features/canvas/components/HistoryButtons";
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
  const [permissions, setPermissions] = useState<Permissions[]>([]);

  useEffect(() => {
    if (!roomId) {
      const newRoomId = crypto.randomUUID();
      navigate(`/${newRoomId}`, { replace: true });
    }
  }, [roomId, navigate]);

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

  if (!roomId) return null;

  return (
    <>
      <div className="flex flex-row h-screen justify-center items-center bg-neutral-800 relative">
        <Canvas roomId={roomId!} role={permission?.role} />
      </div>
      {permission?.role != "viewer" && <>
        <HistoryButtons />
        <Toolbar />
        <ToolOptions />
        <ShareCanvas roomId={roomId!} />
      </>
      }
      <CanvasList />
    </>
  );
}

export default App;
