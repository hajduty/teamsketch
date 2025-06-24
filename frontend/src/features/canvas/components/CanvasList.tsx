import { useEffect, useState } from "react";
import apiClient from "../../../lib/apiClient";
import { apiRoutes } from "../../../lib/apiRoutes";
import Icon from "../../../components/Icon";
import { useAuth } from "../../auth/AuthProvider";
import { useCanvasStore } from "../canvasStore";
import { useNavigate } from "react-router-dom";
import { getUUID } from "../../../utils/utils";

interface Permission {
  roomId: string;
  role: string;
  userEmail?: string;
}

export const CanvasList = () => {
  const navigate = useNavigate();
  const { guest } = useAuth();
  const { guestRooms } = useCanvasStore();
  
  const [rooms, setRooms] = useState<Permission[]>([]);
  const [collapsed, setCollapsed] = useState(true);

  const fetchMyRooms = async () => {
    if (guest) {
      setRooms(guestRooms);
      return;
    }

    try {
      const response = await apiClient.get(apiRoutes.permission.getMyRooms);
      setRooms(response.data);
    } catch (err: any) {
      console.error("Failed to fetch rooms", err);
    }
  };

  useEffect(() => {
    fetchMyRooms();
  }, [guestRooms]);

  const toggleCollapse = () => {
    setCollapsed(!collapsed);
  };

  return (
    <div className="fixed top-0 left-0 group hover:z-3 z-2 m-4 ">
      <div className="w-64 border border-neutral-700 bg-neutral-950 rounded-md overflow-hidden hover:overflow-y-auto scrollbar-thin scrollbar-thumb-neutral-600">
        <div className=" bg-neutral-950 p-3 text-white space-y-2">

          {/* Collapsible Header */}
          <div
            onClick={toggleCollapse}
            className="flex items-center cursor-pointer select-none font-semibold text-sm"
          >
            <Icon iconName={collapsed ? "expand_more" : "expand_less"} color="white" />
            <span>My rooms</span>
          </div>

          {/* Collapsible content */}
          {(
            <>
              <div
                className={`overflow-hidden transition-all duration-150 ease-in-out ${collapsed ? "max-h-0 opacity-0" : "max-h-[500px] opacity-100"
                  }`}>
                {/* New Room Button */}
                {rooms.length === 0 ? (<>
                  <button
                    onClick={() => {
                      const newRoomId = getUUID();
                      navigate(`/${newRoomId}`);
                    }}
                    className="w-full bg-blue-600 hover:bg-blue-500 transition duration-75 rounded px-3 py-1 text-sm font-medium"
                  >
                    New room
                  </button>
                </>
                ) : (
                  <ul className="space-y-2 max-h-72 overflow-auto scrollbar-thin scrollbar-thumb-neutral-600">
                    <button
                      onClick={() => {
                        const newRoomId = getUUID();
                        navigate(`/${newRoomId}`);
                      }}
                      className="w-full bg-blue-600 hover:bg-blue-500 transition duration-75 rounded px-3 py-1 text-sm font-medium"
                    >
                      New room
                    </button>
                    {rooms.map((perm) => (
                      <li
                        key={perm.roomId}
                        className="flex justify-between items-center border border-neutral-700 rounded p-2 hover:bg-neutral-800 transition"
                      >
                        <div className="flex flex-col min-w-0 flex-1 mr-2">
                          <span className="font-medium text-sm break-all">
                            Room ID:
                          </span>
                          <span className="font-medium text-sm break-all">
                            {perm.roomId}
                          </span>
                          <span className="text-sm text-neutral-400">
                            Role: {perm.role}
                          </span>
                        </div>
                        <button
                          onClick={() => navigate(`/${perm.roomId}`)}
                          className="text-blue-400 text-sm flex items-center gap-1 flex-shrink-0 cursor-pointer"
                        >
                          <Icon iconName="arrow_forward" fontSize="20px" color="white" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div >
  );
};
