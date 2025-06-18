import { RelativePathString, router, usePathname } from "expo-router";
import {
  HomeIcon,
  NotebookIcon,
  PlusIcon,
  PowerCircleIcon,
} from "lucide-react-native";
import React, { useState } from "react";
import { TouchableOpacity, View } from "react-native";
import NewSessionModal from "./new-session-modal";

const Routes = () => {
  const pathname = usePathname();
  const [openModal, setOpenModal] = useState(false);

  const navigateTo = (path: string) => {
    if (pathname === path) return;
    router.replace(path as RelativePathString);
  };

  const getIconColor = (path: string) => {
    return pathname === path ? "#10b981" : "#6b7280";
  };

  return (
    <>
      <View
        className="w-full flex-row justify-evenly items-center bg-white px-2 py-3 border-b border-gray-200"
        style={{
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 3,
        }}
      >
        <TouchableOpacity
          onPress={() => navigateTo("/")}
          className="px-4 py-2 rounded-full"
          activeOpacity={0.7}
        >
          <HomeIcon size={24} color={getIconColor("/")} />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => navigateTo("/new-confession")}
          className="px-4 py-2 rounded-full"
          activeOpacity={0.7}
        >
          <PlusIcon size={24} color={getIconColor("/new-confession")} />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => navigateTo("/top-confessions")}
          className="px-4 py-2 rounded-full"
          activeOpacity={0.7}
        >
          <NotebookIcon size={24} color={getIconColor("/top-confessions")} />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => {
            setOpenModal(true);
          }}
          className="px-4 py-2 rounded-full"
          activeOpacity={0.7}
        >
          <PowerCircleIcon size={24} color="#6B7280" />
        </TouchableOpacity>
      </View>

      <NewSessionModal openModal={openModal} setOpenModal={setOpenModal} />
    </>
  );
};

export default Routes;
