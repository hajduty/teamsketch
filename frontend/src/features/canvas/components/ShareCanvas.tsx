import { useState, useEffect } from "react";
import { Button } from "../../../components/Button";
import Icon from "../../../components/Icon";
import { apiRoutes } from "../../../lib/apiRoutes";
import apiClient from "../../../lib/apiClient";
import { useAuth } from "../../auth/AuthProvider";

interface Permission {
  userEmail: string;
  role: string;
  roomId: string;
}

const GuestView = ({ roomId, onClose, isVisible }: {
  roomId: string; onClose: () => void, isVisible: boolean;
}) => {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    const link = `${window.location.origin}/${roomId}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={onClose}
    >
      <div
        className={`bg-neutral-950 text-white rounded-md p-5 w-auto border border-neutral-700 flex flex-col gap-4 shadow-lg
          transform transition-all duration-200 ease-in-out
          ${isVisible ? "opacity-100 scale-100" : "opacity-0 scale-95"}
        `}
        onClick={(e) => e.stopPropagation()}
      >
        <span className="flex flex-row justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Share Canvas</h2>
          <Button
            onClick={onClose}
            className="hover:bg-neutral-700 border border-transparent p-1 rounded-md"
          >
            <Icon iconName="close" color="white" fontSize="16px" />
          </Button>
        </span>

        <p>This canvas is already public! Just copy this link to share it:</p>
        <div className="flex items-center gap-2">
          <input
            readOnly
            className="bg-neutral-800 text-white px-2 py-1 border border-neutral-600 flex-1 rounded"
            value={`${window.location.origin}/${roomId}`}
          />
          <Button onClick={copyToClipboard} className="hover:bg-green-200 rounded-sm">
            {copied ? "Copied!" : "Copy"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export const ShareCanvas = ({ roomId }: { roomId: any }) => {
  const { guest } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [userEmail, setUserEmail] = useState<string>("");
  const [selectedRole, setSelectedRole] = useState<string>("viewer");
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [error, setError] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string>("");
  const [isAccordionOpen, setIsAccordionOpen] = useState<boolean>(false);
  const [isVisible, setIsVisible] = useState(false);


  const fetchPermissions = async () => {
    if (!roomId) return;
    try {
      const response = await apiClient.get(apiRoutes.permission.getByRoom(roomId));
      setPermissions(response.data);
      setError("");
    } catch (err: any) {
      console.error("Fetch permissions failed", err);
      setError("Failed to fetch permissions");
    }
  };

  const updateUserRole = async (userEmail: string, newRole: string) => {
    const permissionToUpdate = permissions.find((p) => p.userEmail === userEmail);
    if (!permissionToUpdate) return;

    const updatedPermission = { ...permissionToUpdate, role: newRole };

    try {
      await apiClient.put(apiRoutes.permission.edit, updatedPermission);
      setPermissions((prev) =>
        prev.map((p) =>
          p.userEmail === userEmail ? { ...p, role: newRole } : p
        )
      );
    } catch (err: any) {
      console.error("Edit user role failed", err);
      setError("Failed to update user role");
    }
  };

  const addUser = async () => {
    if (!userEmail || !roomId) return;
    try {
      await apiClient.post(apiRoutes.permission.add, {
        userEmail,
        roomId,
        role: selectedRole,
      });
      setUserEmail("");
      setSuccessMessage("All done! Send this link to your friend:");
      await fetchPermissions();
    } catch (err: any) {
      console.error("Add user failed", err);
      setError("Failed to add user");
    }
  };

  const deleteUser = async (permission: Permission) => {
    try {
      await apiClient.delete(apiRoutes.permission.remove, { data: permission });
      setPermissions((prev) =>
        prev.filter((p) => p.userEmail !== permission.userEmail)
      );
    } catch (err: any) {
      console.error("Delete user failed", err);
      setError("Failed to delete user");
    }
  };

  const copyToClipboard = () => {
    const link = `${window.location.origin}/${roomId}`;
    navigator.clipboard.writeText(link);
    setSuccessMessage("Copied!");
  };

  useEffect(() => {
    if (isModalOpen && !guest && roomId) {
      fetchPermissions();
    }
  }, [isModalOpen, guest, roomId]);

  const openModal = () => {
    setIsModalOpen(true);
    // wait a frame so that modal renders before applying visible class
    requestAnimationFrame(() => setIsVisible(true));
  };

  const closeModal = () => {
    setIsVisible(false);
    // wait for animation to finish before fully closing modal
    setError("");
    setSuccessMessage("");
    setTimeout(() => setIsModalOpen(false), 200);
  };

  return (
    <>
      <div className="fixed top-0 right-16 m-6 z-10">
        <button
          onClick={openModal}
          className="p-2 bg-blue-600 border border-neutral-700 rounded-md flex hover:bg-blue-500 transition duration-75"
        >
          <Icon iconName="share" color="white" />
        </button>

      </div>

      {isModalOpen && guest && (
        <>
          <div className={`absolute inset-0 bg-black transition-opacity duration-200 ${isVisible ? "opacity-80" : "opacity-0"} z-10`} />
          <GuestView roomId={roomId} onClose={closeModal} isVisible={isVisible} />
        </>
      )}

      {isModalOpen && !guest && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          onClick={closeModal}
        >
          <div
            className={`bg-neutral-950 text-white rounded-md p-5 w-auto max-h-[85vh] overflow-y-auto border border-neutral-700 flex flex-col gap-4 shadow-lg
              transform transition-all duration-200 ease-in-out
              ${isVisible ? "opacity-100 scale-100" : "opacity-0 scale-95"}
              `}
            onClick={(e) => e.stopPropagation()}
          >
            <span className="flex flex-row justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Share Canvas</h2>
              <Button
                onClick={closeModal}
                className="hover:bg-neutral-700 border border-transparent p-1 rounded-md"
              >
                <Icon iconName="close" color="white" fontSize="16px" />
              </Button>
            </span>

            <div className="flex gap-2 mb-3">
              <input
                placeholder="User email"
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
                className="flex-1 rounded border border-neutral-600 bg-neutral-950 px-3 py-2 placeholder:text-neutral-400 text-white focus:outline-none"
              />

              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="rounded border border-neutral-600 bg-neutral-950 px-2 py-2 text-white focus:outline-none"
              >
                <option value="viewer">Viewer</option>
                <option value="editor">Editor</option>
              </select>

              <button
                onClick={addUser}
                className="flex m-auto p-2 rounded-sm text-white gap-1 bg-blue-600 hover:bg-blue-500 transition duration-75"
              >
                <Icon iconName="add" color="white" />
                Add
              </button>
            </div>

            {error && <p className="text-red-500 text-sm">{error}</p>}

            {successMessage && (
              <div className="bg-green-800 text-green-300 p-2 rounded flex flex-col gap-1 text-sm">
                <p>{successMessage}</p>
                <div className="flex items-center gap-2">
                  <input
                    readOnly
                    className="bg-neutral-800 text-white px-2 py-1 border border-neutral-600 flex-1 rounded"
                    value={`${window.location.origin}/${roomId}`}
                  />
                  <Button onClick={copyToClipboard} className="hover:bg-green-200 rounded-sm">
                    Copy
                  </Button>
                </div>
              </div>
            )}

            <div>
              <h3
                className="font-semibold mb-2 cursor-pointer flex items-center gap-1 select-none"
                onClick={() => setIsAccordionOpen((prev) => !prev)}
              >
                <Icon
                  iconName={isAccordionOpen ? "expand_less" : "expand_more"}
                  color="white"
                />
                Users with Access
              </h3>

              <div
                className={`transition-max-height duration-300 ease-in-out overflow-hidden ${isAccordionOpen ? "max-h-56" : "max-h-0"
                  }`}
              >
                <ul className="text-sm">
                  {permissions.map((perm) => (
                    <li
                      key={perm.userEmail}
                      className="flex justify-between items-center border rounded-sm p-2 border-neutral-700 my-3"
                    >
                      <span className="flex gap-2 items-center">
                        {perm.role != "owner"
                          ? perm.userEmail
                          : `${perm.userEmail} (Owner)`}

                        {perm.role != "owner" && (
                          <select
                            value={perm.role}
                            onChange={(e) =>
                              updateUserRole(perm.userEmail, e.target.value)
                            }
                            className="bg-neutral-800 border border-neutral-600 text-white rounded px-2 py-1 text-sm"
                          >
                            <option value="viewer">Viewer</option>
                            <option value="editor">Editor</option>
                          </select>
                        )}
                      </span>

                      {perm.role != "owner" && (
                        <button
                          onClick={() => deleteUser(perm)}
                          className="border-neutral-700 border hover:bg-neutral-800 flex rounded-sm px-1 py-1 text-sm transition duration-75"
                        >
                          <Icon iconName="delete" color="red" />
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
