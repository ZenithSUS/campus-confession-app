import { useSession } from "@/context/session";
import {
  getSingleData,
  storeSingleData,
} from "@/services/react-native-storage";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import { Alert, Modal, Pressable, Text, View } from "react-native";

type Props = {
  openModal: boolean;
  setOpenModal: React.Dispatch<React.SetStateAction<boolean>>;
};

const NewSessionModal = ({ openModal, setOpenModal }: Props) => {
  const { clearSession } = useSession();
  const COOLDOWN_DURATION = 2 * 60 * 60 * 1000;
  const [cooldownEndTime, setCooldownEndTime] = useState<number>(0);
  const [remainingTime, setRemainingTime] = useState<number>(0);
  const [isInCooldown, setIsInCooldown] = useState<boolean>(false);

  const formatTime = (ms: number) => {
    const hours = Math.floor(ms / (60 * 60 * 1000));
    const minutes = Math.floor((ms % (60 * 60 * 1000)) / (60 * 1000));
    const seconds = Math.floor((ms % (60 * 1000)) / 1000);
    return `${hours}h ${minutes}m ${seconds}s`;
  };

  const handleNewSession = async () => {
    // Only proceed if not in cooldown
    if (isInCooldown) {
      Alert.alert(
        "Cooldown Active",
        `Please wait ${formatTime(
          remainingTime
        )} before starting a new session.`
      );
      return;
    }

    await clearSession();
    // Store the end time of the cooldown (current time + duration)
    const cooldownEnd = Date.now() + COOLDOWN_DURATION;
    await storeSingleData("cooldownEndTime", cooldownEnd.toString());
    setOpenModal(false);
    router.replace("/");
  };

  // Check cooldown status
  const checkCooldown = async () => {
    try {
      const savedCooldownEndTime = await getSingleData("cooldownEndTime");
      const endTime = Number(savedCooldownEndTime) || 0;
      const now = Date.now();

      setCooldownEndTime(endTime);

      if (endTime > now) {
        // Still in cooldown
        const remaining = endTime - now;
        setRemainingTime(remaining);
        setIsInCooldown(true);
      } else {
        // Cooldown expired
        setRemainingTime(0);
        setIsInCooldown(false);
      }
    } catch (error) {
      console.error("Error checking cooldown:", error);
      setIsInCooldown(false);
    }
  };

  // Update remaining time every second
  useEffect(() => {
    let interval: Number;

    if (openModal && isInCooldown) {
      interval = setInterval(() => {
        const now = Date.now();
        const remaining = cooldownEndTime - now;

        if (remaining <= 0) {
          setRemainingTime(0);
          setIsInCooldown(false);
        } else {
          setRemainingTime(remaining);
        }
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval as number);
    };
  }, [openModal, isInCooldown, cooldownEndTime]);

  // Check cooldown when modal opens
  useEffect(() => {
    if (openModal) {
      checkCooldown();
    }
  }, [openModal]);

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
          <Text className="text-lg font-semibold text-center mb-4 text-gray-800">
            New Session
          </Text>
          <Text className="text-gray-600 text-center mb-6">
            Are you sure you want to start a new session?
          </Text>

          {isInCooldown && (
            <View className="bg-orange-50 border border-orange-200 rounded-md p-3 mb-4">
              <Text className="text-orange-700 text-center text-sm font-medium">
                ⏱️ Cooldown Active
              </Text>
              <Text className="text-orange-600 text-center text-sm mt-1">
                Next session available in: {formatTime(remainingTime)}
              </Text>
            </View>
          )}

          <View className="flex-row justify-between gap-3">
            <Pressable
              className="flex-1 bg-gray-200 p-3 rounded-md justify-center items-center"
              onPress={() => setOpenModal(false)}
            >
              <Text className="text-gray-800 text-center font-medium">
                Cancel
              </Text>
            </Pressable>

            <Pressable
              className={`flex-1 p-3 rounded-md justify-center items-center ${
                isInCooldown ? "bg-gray-300" : "bg-red-500"
              }`}
              onPress={handleNewSession}
              disabled={isInCooldown}
            >
              <Text
                className={`text-center font-medium ${
                  isInCooldown ? "text-gray-500" : "text-white"
                }`}
              >
                {isInCooldown ? "Cooldown Active" : "Confirm"}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default NewSessionModal;
