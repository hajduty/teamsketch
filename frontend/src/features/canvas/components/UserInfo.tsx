import { useState } from "react";
import { Button } from "../../../components/Button";
import Icon from "../../../components/Icon";
import { useAuth } from "../../auth/AuthProvider";

export const UserInfo = () => {
  const { user, logout, guest } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  const openModal = () => {
    setIsModalOpen(true);
    requestAnimationFrame(() => setIsVisible(true));
  };

  const closeModal = () => {
    setIsVisible(false);
    setTimeout(() => setIsModalOpen(false), 200);
  };

  return (
    <>
      <div className="fixed top-0 right-0 m-6">
        <button
          onClick={openModal}
          className="p-2 bg-blue-600 border border-blue-500 rounded-md flex hover:bg-blue-500 transition duration-75"
        >
          <Icon iconName="account_circle" color="white" />
        </button>
      </div>

      {isModalOpen && (
        <>
          <div
            className={`absolute inset-0 bg-black transition-opacity duration-200 ${isVisible ? "opacity-80" : "opacity-0"} z-10`}
            onClick={closeModal}
          />
          <div
            className={`fixed inset-0 z-50 flex items-center justify-center`}
            onClick={closeModal}
          >
            <div
              className={`bg-neutral-950 text-white rounded-md p-5 w-auto border border-neutral-700 flex flex-col gap-4 shadow-lg
                transform transition-all duration-200 ease-in-out
                ${isVisible ? "opacity-100 scale-100" : "opacity-0 scale-95"}
              `}
              onClick={(e) => e.stopPropagation()}
            >
              <span className="flex flex-row justify-between items-center mb-2">
                <h2 className="text-lg font-semibold">User Info</h2>
                <Button
                  onClick={closeModal}
                  className="hover:bg-neutral-700 border border-transparent p-1 rounded-md"
                >
                  <Icon iconName="close" color="white" fontSize="16px" />
                </Button>
              </span>

              <div className="text-sm">
                <p><span className="font-semibold">Email:</span> {user?.email}</p>
              </div>
              <div className="text-sm">
                <p><span className="font-semibold">UserId:</span> {user?.id}</p>
              </div>
              <div className="text-sm">
                <p><span className="font-semibold">Guest User:</span> {guest ? "true" : "false"}</p>
              </div>

              <Button
                onClick={logout}
                className="bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded mt-2"
              >
                Logout
              </Button>
            </div>
          </div>
        </>
      )}
    </>
  );
};
