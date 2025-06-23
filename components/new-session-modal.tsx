import { deleteSession, getCurrentSession } from "@/appwrite";
import { useSession } from "@/context/session";
import { router } from "expo-router";
import React from "react";
import { Alert, Modal, Pressable, Text, View } from "react-native";

type Props = {
  openModal: boolean;
  setOpenModal: React.Dispatch<React.SetStateAction<boolean>>;
};

const NewSessionModal = ({ openModal, setOpenModal }: Props) => {
  const { setSession } = useSession();

  const handleNewSession = async () => {
    await deleteSession();
    const session = await getCurrentSession();
    setSession({ $id: session.$id, nickname: session.prefs.nickname });
    setOpenModal(false);
    router.replace("/");
  };

  const storeData = async () => {
    try {
    } catch (error) {}
  };

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={openModal}
      onRequestClose={() => {
        Alert.alert("Modal has been closed.");
        setOpenModal(!openModal);
      }}
    >
      {/* Full screen overlay with semi-transparent background */}
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "rgba(0, 0, 0, 0.5)",
        }}
      >
        {/* Modal content */}
        <View
          style={{
            backgroundColor: "white",
            padding: 24,
            borderRadius: 12,
            marginHorizontal: 16,
            width: "90%",
            maxWidth: 400,
          }}
        >
          <Text className="text-lg font-semibold text-center mb-4">
            New Session
          </Text>
          <Text className="text-gray-600 text-center mb-6">
            Are you sure you want to start a new session?
          </Text>

          <View className="flex-row justify-between gap-3">
            <Pressable
              className="flex-1 bg-gray-200 p-3 rounded-md"
              onPress={() => setOpenModal(false)}
            >
              <Text className="text-gray-800 text-center font-medium">
                Cancel
              </Text>
            </Pressable>

            <Pressable
              className="flex-1 bg-red-500 p-3 rounded-md"
              onPress={() => handleNewSession()}
            >
              <Text className="text-white text-center font-medium">
                Confirm
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default NewSessionModal;
