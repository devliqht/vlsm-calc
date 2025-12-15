"use client";

import { useState } from "react";

export const useIPInput = () => {
  const [ipParts, setIpParts] = useState(["", "", "", ""]);
  const [cidr, setCidr] = useState("");

  const handleIpChange = (index: number, value: string) => {
    const newValue = value.replace(/[^0-9]/g, "");
    const numValue = Number.parseInt(newValue);

    if (newValue === "" || (numValue >= 0 && numValue <= 255)) {
      const newIpParts = [...ipParts];
      newIpParts[index] = newValue;
      setIpParts(newIpParts);

      // auto-focus next input
      if (newValue.length >= 3 && index < 3) {
        const nextInput = document.getElementById(`ip-part-${index + 1}`);
        if (nextInput) nextInput.focus();
      }
    }
  };

  const handleIpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "." || e.key === " ") {
      e.preventDefault();
      if (index < 3) {
        const nextInput = document.getElementById(`ip-part-${index + 1}`);
        if (nextInput) nextInput.focus();
      }
    } else if (e.key === "Backspace" && ipParts[index] === "" && index > 0) {
      e.preventDefault();
      const prevInput = document.getElementById(`ip-part-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  const handleCidrChange = (value: string) => {
    const newValue = value.replace(/[^0-9]/g, "");
    const numValue = Number.parseInt(newValue);

    if (newValue === "" || (numValue >= 0 && numValue <= 32)) {
      setCidr(newValue);
    }
  };

  const setIPFromString = (ip: string) => {
    setIpParts(ip.split("."));
  };

  const getIPString = () => {
    return ipParts.join(".");
  };

  return {
    ipParts,
    cidr,
    setIpParts,
    setCidr,
    handleIpChange,
    handleIpKeyDown,
    handleCidrChange,
    setIPFromString,
    getIPString,
  };
};
