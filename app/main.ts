import { useEffect, useState, useRef } from "react";
import StreamingAvatar, { AvatarQuality, StreamingEvents,TaskType } from "@heygen/streaming-avatar";

export function useHeyGen() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [avatar, setAvatar] = useState<StreamingAvatar | null>(null);
  const [sessionData, setSessionData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Fetch Access Token
  const fetchAccessToken = async (): Promise<string | null> => {
    const apiKey = process.env.NEXT_PUBLIC_HEYGEN_API_KEY;

    if (!apiKey) {
      console.error("HeyGen API key is missing.");
      return null;
    }

    try {
      const response = await fetch("https://api.heygen.com/v1/streaming.create_token", {
        method: "POST",
        headers: { "x-api-key": apiKey },
      });

      if (!response.ok) throw new Error("Failed to fetch access token");
      
      const { data } = await response.json();
      return data?.token || null;
    } catch (error) {
      console.error("Error fetching access token:", error);
      return null;
    }
  };

  // Start HeyGen Avatar Session
  const startSession = async () => {
    setLoading(true);
    const token = await fetchAccessToken();
    if (!token) return;

    const avatarInstance = new StreamingAvatar({ token });

    try {
      const session = await avatarInstance.createStartAvatar({
        quality: AvatarQuality.High,
        avatarName: "Wayne_20240711", // Change to your avatar name
        language: "English"
      });

      setSessionData(session);
      setAvatar(avatarInstance);

      avatarInstance.on(StreamingEvents.STREAM_READY, (event) => {
        if (event.detail && videoRef.current) {
          videoRef.current.srcObject = event.detail;
          videoRef.current.play().catch(console.error);
        }
      });

      avatarInstance.on(StreamingEvents.STREAM_DISCONNECTED, () => {
        console.log("Stream disconnected");
        if (videoRef.current) videoRef.current.srcObject = null;
        setAvatar(null);
      });

    } catch (error) {
      console.error("Failed to start session:", error);
    } finally {
      setLoading(false);
    }
  };

  // End Avatar Session
  const endSession = async () => {
    if (avatar) {
      await avatar.stopAvatar();
      if (videoRef.current) videoRef.current.srcObject = null;
      setAvatar(null);
    }
  };

  // Speak Function
  const speak = async (text: string) => {
    if (!avatar) {
      console.error("Avatar instance is null!");
      return;
    }
  
    try {
      console.log("Passing text to avatar.speak:", text);
  
      await avatar.speak({
        text: text,
        taskType: TaskType.REPEAT,
      });
  
      console.log("Avatar speaking complete.");
    } catch (error) {
      console.error("Error speaking:", error);
    }
  };

  return { videoRef, startSession, endSession, speak, loading };
}
