"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Trash2, Plus, Calculator, Clock, X, Dices, Search } from "lucide-react"
import { cn } from "@/lib/utils"
import { ThemeToggle } from "../theme-toggle"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface Subnet {
  id: string
  name: string
  requiredHosts: number
  allocatedHosts?: number
  networkAddress?: string
  subnetMask?: string
  subnetMaskBinary?: string
  cidr?: number
  firstUsable?: string
  lastUsable?: string
  broadcast?: string
  totalIPs?: number
  delta?: number
  borrowedBits?: number
  position?: number
}

interface OriginalIPDetails {
  networkAddress: string
  broadcast: string
  firstUsable: string
  lastUsable: string
  subnetMask: string
  delta?: number
  totalIPs: number
  subnetIncrement?: number
  borrowedBits?: number
  subnetBits?: number
  hostBits?: number
  totalSubnets?: number
}

interface HistoryItem {
  id: string
  timestamp: number
  ipAddress: string
  cidr: string
  subnets: Subnet[]
  results: Subnet[]
  originalIPDetails: OriginalIPDetails | null
  mode: "vlsm" | "subnetting"
  numSubnets?: number
}

export default function VLSMCalculator() {
  const [mode, setMode] = useState<"vlsm" | "subnetting">("vlsm")
  const [ipParts, setIpParts] = useState(["", "", "", ""])
  const [cidr, setCidr] = useState("")
  const [numSubnets, setNumSubnets] = useState("")
  const [subnets, setSubnets] = useState<Subnet[]>([{ id: "1", name: "Subnet 1", requiredHosts: 0 }])
  const [results, setResults] = useState<Subnet[]>([])
  const [originalIPDetails, setOriginalIPDetails] = useState<OriginalIPDetails | null>(null)
  const [error, setError] = useState("")
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [subnetSearchStart, setSubnetSearchStart] = useState("")
  const [subnetSearchEnd, setSubnetSearchEnd] = useState("")
  const [filteredResults, setFilteredResults] = useState<Subnet[]>([])
  const [isSearching, setIsSearching] = useState(false)

  // Load history from localStorage on component mount
  useEffect(() => {
    const savedHistory = localStorage.getItem("vlsm-history")
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory))
      } catch (e) {
        console.error("Failed to parse history from localStorage", e)
      }
    }
  }, [])

  // Save history to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("vlsm-history", JSON.stringify(history))
  }, [history])

  // Handle IP address input changes
  const handleIpChange = (index: number, value: string) => {
    const newValue = value.replace(/[^0-9]/g, "")
    const numValue = Number.parseInt(newValue)

    if (newValue === "" || (numValue >= 0 && numValue <= 255)) {
      const newIpParts = [...ipParts]
      newIpParts[index] = newValue
      setIpParts(newIpParts)

      // Auto-focus next input if this one is filled
      if (newValue.length >= 3 && index < 3) {
        const nextInput = document.getElementById(`ip-part-${index + 1}`)
        if (nextInput) nextInput.focus()
      }
    }
  }

  // Handle key press in IP input fields
  const handleIpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "." || e.key === " ") {
      e.preventDefault()
      if (index < 3) {
        const nextInput = document.getElementById(`ip-part-${index + 1}`)
        if (nextInput) nextInput.focus()
      }
    } else if (e.key === "Backspace" && ipParts[index] === "" && index > 0) {
      e.preventDefault()
      const prevInput = document.getElementById(`ip-part-${index - 1}`)
      if (prevInput) prevInput.focus()
    }
  }

  // Handle CIDR input changes
  const handleCidrChange = (value: string) => {
    const newValue = value.replace(/[^0-9]/g, "")
    const numValue = Number.parseInt(newValue)

    if (newValue === "" || (numValue >= 0 && numValue <= 32)) {
      setCidr(newValue)
    }
  }

  // Handle number of subnets input changes
  const handleNumSubnetsChange = (value: string) => {
    const newValue = value.replace(/[^0-9]/g, "")
    const numValue = Number.parseInt(newValue)

    if (newValue === "" || numValue >= 0) {
      setNumSubnets(newValue)
    }
  }

  // Add a new subnet
  const addSubnet = () => {
    setSubnets([...subnets, { id: Date.now().toString(), name: `Subnet ${subnets.length + 1}`, requiredHosts: 0 }])
  }

  // Remove a subnet
  const removeSubnet = (id: string) => {
    if (subnets.length > 1) {
      setSubnets(subnets.filter((subnet) => subnet.id !== id))
    }
  }

  // Update subnet properties
  const updateSubnet = (id: string, field: keyof Subnet, value: string | number) => {
    setSubnets(subnets.map((subnet) => (subnet.id === id ? { ...subnet, [field]: value } : subnet)))
  }

  // Calculate delta value based on prefix
  const calculateDelta = (prefix: number): number | undefined => {
    // No delta for these specific prefixes
    if (prefix === 0 || prefix === 8 || prefix === 16 || prefix === 24 || prefix === 32) {
      return undefined
    }

    // Determine group and calculate delta
    if (prefix > 24 && prefix < 32) {
      return Math.pow(2, 32 - prefix)
    } else if (prefix > 16 && prefix < 24) {
      return Math.pow(2, 24 - prefix)
    } else if (prefix > 8 && prefix < 16) {
      return Math.pow(2, 16 - prefix)
    } else if (prefix > 0 && prefix < 8) {
      return Math.pow(2, 8 - prefix)
    }

    return undefined
  }

  // Convert decimal to binary with dots
  const decimalToBinary = (ip: string): string => {
    return ip
      .split(".")
      .map((octet) => Number.parseInt(octet).toString(2).padStart(8, "0"))
      .join(".")
  }

  // Calculate original IP details
  const calculateOriginalIPDetails = (ipAddress: string, prefix: number, borrowedBits?: number): OriginalIPDetails => {
    const ipBinary = ipToBinary(ipAddress)
    const networkBinary = ipBinary.substring(0, prefix).padEnd(32, "0")
    const broadcastBinary = ipBinary.substring(0, prefix).padEnd(32, "1")

    const networkAddress = binaryToIp(networkBinary)
    const broadcast = binaryToIp(broadcastBinary)

    const firstUsableBinary = networkBinary.substring(0, 32).slice(0, -1) + "1"
    const lastUsableBinary = broadcastBinary.substring(0, 32).slice(0, -1) + "0"

    const firstUsable = binaryToIp(firstUsableBinary)
    const lastUsable = binaryToIp(lastUsableBinary)

    const subnetMask = cidrToSubnetMask(prefix)
    const delta = calculateDelta(prefix)
    const totalIPs = Math.pow(2, 32 - prefix)

    // Calculate subnet increment if borrowedBits is provided (for subnetting mode)
    let subnetIncrement: number | undefined
    let subnetBits: number | undefined
    let hostBits: number | undefined
    let totalSubnets: number | undefined

    if (borrowedBits !== undefined) {
      // Calculate which octet the subnet increment affects
      if (prefix + borrowedBits > 24) {
        // 4th octet
        subnetIncrement = Math.pow(2, 32 - (prefix + borrowedBits))
      } else if (prefix + borrowedBits > 16) {
        // 3rd octet
        subnetIncrement = Math.pow(2, 24 - (prefix + borrowedBits))
      } else if (prefix + borrowedBits > 8) {
        // 2nd octet
        subnetIncrement = Math.pow(2, 16 - (prefix + borrowedBits))
      } else {
        // 1st octet
        subnetIncrement = Math.pow(2, 8 - (prefix + borrowedBits))
      }

      subnetBits = borrowedBits
      hostBits = 32 - (prefix + borrowedBits)
      totalSubnets = Math.pow(2, borrowedBits)
    }

    return {
      networkAddress,
      broadcast,
      firstUsable,
      lastUsable,
      subnetMask,
      delta,
      totalIPs,
      subnetIncrement,
      borrowedBits,
      subnetBits,
      hostBits,
      totalSubnets,
    }
  }

  // Calculate the actual subnet size needed for a given number of hosts
  const calculateActualSubnetSize = (requiredHosts: number): number => {
    // Add 2 for network and broadcast addresses
    const totalNeeded = requiredHosts + 2
    // Find the smallest power of 2 that can accommodate the hosts
    const bitsNeeded = Math.ceil(Math.log2(totalNeeded))
    // Calculate the actual subnet size (usable hosts)
    return Math.pow(2, bitsNeeded) - 2
  }

  // Calculate VLSM
  const calculateVLSM = () => {
    // Validate IP address
    if (ipParts.some((part) => part === "" || Number.parseInt(part) > 255)) {
      setError("Please enter a valid IP address")
      return
    }

    // Validate CIDR
    const cidrNum = Number.parseInt(cidr)
    if (isNaN(cidrNum) || cidrNum < 0 || cidrNum > 32) {
      setError("Please enter a valid prefix (0-32)")
      return
    }

    if (mode === "vlsm") {
      // Validate subnets
      if (subnets.some((subnet) => subnet.requiredHosts <= 0)) {
        setError("All subnets must have at least 1 required host")
        return
      }

      // Calculate total available hosts based on prefix
      const availableHosts = Math.pow(2, 32 - cidrNum) - 2 // Subtract 2 for network and broadcast addresses

      // Calculate total required hosts with proper subnet sizing
      let totalActualSubnetSize = 0
      for (const subnet of subnets) {
        totalActualSubnetSize += calculateActualSubnetSize(subnet.requiredHosts)
      }

      // Validate if total required hosts exceed available hosts
      if (totalActualSubnetSize > availableHosts) {
        setError(
          `Total subnet size (${totalActualSubnetSize}) exceeds available hosts (${availableHosts}) for /${cidrNum} prefix. ` +
            `Subnet sizes must be powers of 2 minus 2.`,
        )
        return
      }

      setError("")

      // Calculate original IP details
      const ipAddress = ipParts.join(".")
      const details = calculateOriginalIPDetails(ipAddress, cidrNum)
      setOriginalIPDetails(details)

      // Sort subnets by required hosts (descending)
      const sortedSubnets = [...subnets].sort((a, b) => b.requiredHosts - a.requiredHosts)

      // Calculate subnet allocations
      const calculatedSubnets = calculateSubnets(ipAddress, cidrNum, sortedSubnets)

      setResults(calculatedSubnets)
      setFilteredResults(calculatedSubnets)
      setIsSearching(false)

      // Add to history
      const historyItem: HistoryItem = {
        id: Date.now().toString(),
        timestamp: Date.now(),
        ipAddress,
        cidr,
        subnets: [...subnets],
        results: calculatedSubnets,
        originalIPDetails: details,
        mode: "vlsm",
      }

      setHistory((prev) => [historyItem, ...prev.slice(0, 9)]) // Keep only the 10 most recent items
    } else {
      // Subnetting mode
      // Validate number of subnets
      const numSubnetsNum = Number.parseInt(numSubnets)
      if (isNaN(numSubnetsNum) || numSubnetsNum <= 0) {
        setError("Please enter a valid number of subnets")
        return
      }

      // Calculate borrowed bits
      const borrowedBits = Math.ceil(Math.log2(numSubnetsNum))

      // Validate if we have enough bits to borrow
      if (cidrNum + borrowedBits > 30) {
        // Leave at least 2 bits for hosts (network + broadcast)
        setError(`Cannot create ${numSubnetsNum} subnets with /${cidrNum} prefix. Not enough host bits available.`)
        return
      }

      setError("")

      // Calculate original IP details with borrowed bits
      const ipAddress = ipParts.join(".")
      const details = calculateOriginalIPDetails(ipAddress, cidrNum, borrowedBits)
      setOriginalIPDetails(details)

      // Calculate subnet allocations for equal-sized subnets
      const calculatedSubnets = calculateEqualSubnets(ipAddress, cidrNum, numSubnetsNum, borrowedBits)

      setResults(calculatedSubnets)
      setFilteredResults(calculatedSubnets)
      setIsSearching(false)

      // Add to history
      const historyItem: HistoryItem = {
        id: Date.now().toString(),
        timestamp: Date.now(),
        ipAddress,
        cidr,
        subnets: [],
        results: calculatedSubnets,
        originalIPDetails: details,
        mode: "subnetting",
        numSubnets: numSubnetsNum,
      }

      setHistory((prev) => [historyItem, ...prev.slice(0, 9)]) // Keep only the 10 most recent items
    }
  }

  // Calculate subnet allocations for VLSM
  const calculateSubnets = (ipAddress: string, cidr: number, subnets: Subnet[]): Subnet[] => {
    // Convert IP to binary
    const ipBinary = ipToBinary(ipAddress)

    // Get network address binary string
    let networkBinary = ipBinary.substring(0, cidr).padEnd(32, "0")

    const results: Subnet[] = []

    for (const subnet of subnets) {
      // Calculate required subnet size
      const hostsNeeded = subnet.requiredHosts + 2 // Add 2 for network and broadcast addresses
      const bitsNeeded = Math.ceil(Math.log2(hostsNeeded))
      const subnetCidr = 32 - bitsNeeded

      // Calculate borrowed bits
      const borrowedBits = subnetCidr - cidr

      // Calculate subnet mask
      const subnetMask = cidrToSubnetMask(subnetCidr)
      const subnetMaskBinary = decimalToBinary(subnetMask)

      // Calculate network address
      const networkAddress = binaryToIp(networkBinary)

      // Calculate broadcast address
      const broadcastBinary = networkBinary.substring(0, subnetCidr).padEnd(32, "1")
      const broadcastAddress = binaryToIp(broadcastBinary)

      // Calculate first and last usable addresses
      const firstUsableBinary = networkBinary.substring(0, 32).slice(0, -1) + "1"
      const lastUsableBinary = broadcastBinary.substring(0, 32).slice(0, -1) + "0"

      const firstUsable = binaryToIp(firstUsableBinary)
      const lastUsable = binaryToIp(lastUsableBinary)

      // Calculate total IPs
      const totalIPs = Math.pow(2, 32 - subnetCidr)

      // Calculate delta
      const delta = calculateDelta(subnetCidr)

      // Add to results
      results.push({
        ...subnet,
        networkAddress,
        subnetMask,
        subnetMaskBinary,
        cidr: subnetCidr,
        firstUsable,
        lastUsable,
        broadcast: broadcastAddress,
        allocatedHosts: Math.pow(2, bitsNeeded) - 2,
        totalIPs,
        delta,
        borrowedBits,
      })

      // Move to next subnet
      const nextNetworkBinary = incrementBinary(broadcastBinary)
      networkBinary = nextNetworkBinary
    }

    return results
  }

  // Calculate subnet allocations for equal-sized subnets (Subnetting mode)
  const calculateEqualSubnets = (
    ipAddress: string,
    cidr: number,
    numSubnets: number,
    borrowedBits: number,
  ): Subnet[] => {
    // Convert IP to binary
    const ipBinary = ipToBinary(ipAddress)

    // Get network address binary string
    const networkBinary = ipBinary.substring(0, cidr).padEnd(32, "0")

    // Calculate new subnet prefix
    const subnetCidr = cidr + borrowedBits

    // Calculate subnet mask
    const subnetMask = cidrToSubnetMask(subnetCidr)
    const subnetMaskBinary = decimalToBinary(subnetMask)

    // Calculate total IPs per subnet
    const totalIPsPerSubnet = Math.pow(2, 32 - subnetCidr)

    // Calculate usable hosts per subnet
    const usableHostsPerSubnet = totalIPsPerSubnet - 2

    // Calculate delta
    const delta = calculateDelta(subnetCidr)

    const results: Subnet[] = []

    // Calculate the actual number of subnets we can create (power of 2)
    const actualNumSubnets = Math.pow(2, borrowedBits)

    // Generate subnets
    for (let i = 0; i < actualNumSubnets; i++) {
      // Calculate subnet network address
      const subnetNetworkBinary =
        networkBinary.substring(0, cidr) +
        i
          .toString(2)
          .padStart(borrowedBits, "0")
          .padEnd(32 - cidr, "0")

      const subnetNetworkAddress = binaryToIp(subnetNetworkBinary)

      // Calculate broadcast address
      const broadcastBinary = subnetNetworkBinary.substring(0, subnetCidr).padEnd(32, "1")
      const broadcastAddress = binaryToIp(broadcastBinary)

      // Calculate first and last usable addresses
      const firstUsableBinary = subnetNetworkBinary.substring(0, 32).slice(0, -1) + "1"
      const lastUsableBinary = broadcastBinary.substring(0, 32).slice(0, -1) + "0"

      const firstUsable = binaryToIp(firstUsableBinary)
      const lastUsable = binaryToIp(lastUsableBinary)

      // Add to results
      results.push({
        id: i.toString(),
        name: `${i + 1}${getOrdinalSuffix(i + 1)} Subnet`,
        requiredHosts: usableHostsPerSubnet, // In subnetting mode, all subnets have the same size
        networkAddress: subnetNetworkAddress,
        subnetMask,
        subnetMaskBinary,
        cidr: subnetCidr,
        firstUsable,
        lastUsable,
        broadcast: broadcastAddress,
        allocatedHosts: usableHostsPerSubnet,
        totalIPs: totalIPsPerSubnet,
        delta,
        borrowedBits,
        position: i + 1,
      })
    }

    return results
  }

  // Get ordinal suffix for a number (1st, 2nd, 3rd, etc.)
  const getOrdinalSuffix = (num: number): string => {
    const j = num % 10
    const k = num % 100
    if (j === 1 && k !== 11) {
      return "st"
    }
    if (j === 2 && k !== 12) {
      return "nd"
    }
    if (j === 3 && k !== 13) {
      return "rd"
    }
    return "th"
  }

  // Helper functions for IP calculations
  const ipToBinary = (ip: string): string => {
    return ip
      .split(".")
      .map((octet) => Number.parseInt(octet).toString(2).padStart(8, "0"))
      .join("")
  }

  const binaryToIp = (binary: string): string => {
    return [0, 8, 16, 24].map((i) => Number.parseInt(binary.substr(i, 8), 2)).join(".")
  }

  const cidrToSubnetMask = (cidr: number): string => {
    const binary = "1".repeat(cidr).padEnd(32, "0")
    return binaryToIp(binary)
  }

  const incrementBinary = (binary: string): string => {
    // Convert to decimal, add 1, convert back to binary
    const decimal = Number.parseInt(binary, 2) + 1
    return decimal.toString(2).padStart(32, "0")
  }

  // Load a history item
  const loadHistoryItem = (item: HistoryItem) => {
    setMode(item.mode)
    const ipParts = item.ipAddress.split(".")
    setIpParts(ipParts)
    setCidr(item.cidr)

    if (item.mode === "vlsm") {
      setSubnets(item.subnets)
    } else if (item.mode === "subnetting" && item.numSubnets) {
      setNumSubnets(item.numSubnets.toString())
    }

    setResults(item.results)
    setFilteredResults(item.results)
    setIsSearching(false)
    setOriginalIPDetails(item.originalIPDetails)
  }

  // Delete a history item
  const deleteHistoryItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation() // Prevent triggering the parent click handler
    setHistory((prev) => prev.filter((item) => item.id !== id))
  }

  // Format date for history display
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString()
  }

  // Generate a random integer between min and max (inclusive)
  const getRandomInt = (min: number, max: number): number => {
    return Math.floor(Math.random() * (max - min + 1)) + min
  }

  // Generate a random valid IP address
  const generateRandomIP = (): string[] => {
    // Generate a random IP in the range 1.0.0.0 to 223.255.255.255
    // Avoiding reserved ranges for simplicity
    const firstOctet = getRandomInt(1, 223)
    const secondOctet = getRandomInt(0, 255)
    const thirdOctet = getRandomInt(0, 255)
    const fourthOctet = getRandomInt(0, 255)

    return [firstOctet.toString(), secondOctet.toString(), thirdOctet.toString(), fourthOctet.toString()]
  }

  // Generate a random valid prefix
  const generateRandomPrefix = (): string => {
    // Generate a prefix between 16 and 28
    // This range provides enough space for subnets while being practical
    return getRandomInt(16, 28).toString()
  }

  // Generate random subnets with host requirements
  const generateRandomSubnets = (availableHosts: number): Subnet[] => {
    // Calculate the total IPs available (including network and broadcast)
    const totalIPs = availableHosts + 2

    // Determine number of subnets (2-10, with bias toward 3-5)
    let numSubnets: number
    const roll = Math.random()
    if (roll < 0.6) {
      // 60% chance for 3-5 subnets
      numSubnets = getRandomInt(3, 5)
    } else if (roll < 0.8) {
      // 20% chance for 2 subnets
      numSubnets = 2
    } else {
      // 20% chance for 6-10 subnets
      numSubnets = getRandomInt(6, 10)
    }

    // Ensure we don't create too many subnets for very small networks
    if (availableHosts < numSubnets * 4) {
      // Minimum 2 hosts per subnet + overhead
      numSubnets = Math.max(2, Math.floor(availableHosts / 4))
    }

    // Create a distribution of subnet sizes that will fit in the available space
    const randomSubnets: Subnet[] = []
    let remainingIPs = totalIPs

    // First, calculate the minimum IPs needed for each subnet
    // Each subnet needs at least 4 IPs (2 hosts + network + broadcast)
    const minIPsPerSubnet = 4
    const minTotalIPs = numSubnets * minIPsPerSubnet

    // If we don't have enough space for all subnets, reduce the number
    if (minTotalIPs > totalIPs) {
      numSubnets = Math.floor(totalIPs / minIPsPerSubnet)
      // Ensure we have at least 1 subnet
      numSubnets = Math.max(1, numSubnets)
    }

    // Now allocate subnets one by one, ensuring we don't exceed available space
    for (let i = 0; i < numSubnets; i++) {
      // For the last subnet, use all remaining IPs
      if (i === numSubnets - 1) {
        // Calculate the largest power of 2 that fits in the remaining space
        const maxBits = Math.floor(Math.log2(remainingIPs))
        const subnetSize = Math.pow(2, maxBits)
        const usableHosts = subnetSize - 2

        // Only add if we have enough for at least 2 hosts
        if (usableHosts >= 2) {
          randomSubnets.push({
            id: Date.now() + i.toString(),
            name: `Subnet ${i + 1}`,
            requiredHosts: getRandomInt(2, usableHosts),
          })
        }
        break
      }

      // For other subnets, allocate a random portion of the remaining space
      // Calculate how much space we can use for this subnet
      const maxRemainingSubnets = numSubnets - i
      const minRemainingIPs = (maxRemainingSubnets - 1) * minIPsPerSubnet
      const maxIPsForThisSubnet = remainingIPs - minRemainingIPs

      // Find the largest power of 2 that fits
      const maxBits = Math.floor(Math.log2(maxIPsForThisSubnet))

      // Ensure we have at least 2 bits (4 IPs)
      const bits = Math.max(2, getRandomInt(2, maxBits))
      const subnetSize = Math.pow(2, bits)
      const usableHosts = subnetSize - 2

      // Add the subnet
      randomSubnets.push({
        id: Date.now() + i.toString(),
        name: `Subnet ${i + 1}`,
        requiredHosts: getRandomInt(2, usableHosts),
      })

      // Update remaining IPs
      remainingIPs -= subnetSize
    }

    // If we couldn't create any subnets (which shouldn't happen with our checks),
    // create at least one minimal subnet
    if (randomSubnets.length === 0) {
      // Calculate the largest subnet we can fit
      const maxBits = Math.floor(Math.log2(totalIPs))
      const subnetSize = Math.pow(2, maxBits)
      const usableHosts = subnetSize - 2

      // Create one subnet with the maximum hosts
      randomSubnets.push({
        id: Date.now() + "1",
        name: "Subnet 1",
        requiredHosts: Math.max(2, usableHosts),
      })
    }

    return randomSubnets
  }

  // Generate random number of subnets for subnetting mode
  const generateRandomNumSubnets = (prefix: number): string => {
    // Calculate maximum number of subnets possible (leaving at least 2 bits for hosts)
    const maxBorrowedBits = 30 - prefix // Leave 2 bits for hosts

    // Limit to a reasonable number (max 8 borrowed bits)
    const limitedBorrowedBits = Math.min(maxBorrowedBits, 8)

    // Calculate maximum number of subnets
    const maxSubnets = Math.pow(2, limitedBorrowedBits)

    // Generate a random number of subnets (between 2 and maxSubnets)
    return getRandomInt(2, Math.min(maxSubnets, 16)).toString()
  }

  // Generate random VLSM scenario and calculate
  const generateRandom = () => {
    // Generate random IP, prefix
    const randomIP = generateRandomIP()
    const randomPrefix = generateRandomPrefix()

    if (mode === "vlsm") {
      // Calculate available hosts based on prefix
      const prefixNum = Number.parseInt(randomPrefix)
      const availableHosts = Math.pow(2, 32 - prefixNum) - 2 // Subtract 2 for network and broadcast addresses

      // Generate valid subnets that fit within the available hosts
      const randomSubnets = generateRandomSubnets(availableHosts)

      // Double-check that the subnets will fit by calculating the actual subnet sizes
      let totalIPsNeeded = 0
      for (const subnet of randomSubnets) {
        // Calculate required subnet size in IPs (including network and broadcast)
        const hostsNeeded = subnet.requiredHosts + 2
        const bitsNeeded = Math.ceil(Math.log2(hostsNeeded))
        const subnetSize = Math.pow(2, bitsNeeded)

        totalIPsNeeded += subnetSize
      }

      // If they don't fit, try again
      if (totalIPsNeeded > availableHosts + 2) {
        // +2 to include network and broadcast in total
        console.error("Generated subnets don't fit, retrying...")
        return generateRandom()
      }

      // Update state
      setIpParts(randomIP)
      setCidr(randomPrefix)
      setSubnets(randomSubnets)

      // Use setTimeout to ensure state updates before calculation
      setTimeout(() => {
        // Calculate VLSM with the random data
        const ipAddress = randomIP.join(".")
        const cidrNum = Number.parseInt(randomPrefix)

        // Calculate original IP details
        const details = calculateOriginalIPDetails(ipAddress, cidrNum)
        setOriginalIPDetails(details)

        // Sort subnets by required hosts (descending)
        const sortedSubnets = [...randomSubnets].sort((a, b) => b.requiredHosts - a.requiredHosts)

        // Calculate subnet allocations
        const calculatedSubnets = calculateSubnets(ipAddress, cidrNum, sortedSubnets)

        setResults(calculatedSubnets)
        setFilteredResults(calculatedSubnets)
        setIsSearching(false)

        // Add to history
        const historyItem: HistoryItem = {
          id: Date.now().toString(),
          timestamp: Date.now(),
          ipAddress,
          cidr: randomPrefix,
          subnets: randomSubnets,
          results: calculatedSubnets,
          originalIPDetails: details,
          mode: "vlsm",
        }

        setHistory((prev) => [historyItem, ...prev.slice(0, 9)]) // Keep only the 10 most recent items
      }, 0)
    } else {
      // Subnetting mode
      // Generate random number of subnets
      const prefixNum = Number.parseInt(randomPrefix)
      const randomNumSubnets = generateRandomNumSubnets(prefixNum)

      // Update state
      setIpParts(randomIP)
      setCidr(randomPrefix)
      setNumSubnets(randomNumSubnets)

      // Use setTimeout to ensure state updates before calculation
      setTimeout(() => {
        // Calculate subnetting with the random data
        const ipAddress = randomIP.join(".")
        const cidrNum = Number.parseInt(randomPrefix)
        const numSubnetsNum = Number.parseInt(randomNumSubnets)

        // Calculate borrowed bits
        const borrowedBits = Math.ceil(Math.log2(numSubnetsNum))

        // Calculate original IP details
        const details = calculateOriginalIPDetails(ipAddress, cidrNum, borrowedBits)
        setOriginalIPDetails(details)

        // Calculate subnet allocations
        const calculatedSubnets = calculateEqualSubnets(ipAddress, cidrNum, numSubnetsNum, borrowedBits)

        setResults(calculatedSubnets)
        setFilteredResults(calculatedSubnets)
        setIsSearching(false)

        // Add to history
        const historyItem: HistoryItem = {
          id: Date.now().toString(),
          timestamp: Date.now(),
          ipAddress,
          cidr: randomPrefix,
          subnets: [],
          results: calculatedSubnets,
          originalIPDetails: details,
          mode: "subnetting",
          numSubnets: numSubnetsNum,
        }

        setHistory((prev) => [historyItem, ...prev.slice(0, 9)]) // Keep only the 10 most recent items
      }, 0)
    }
  }

  // Search for specific subnets (for subnetting mode)
  const searchSubnets = () => {
    if (results.length === 0) return

    const start = Number.parseInt(subnetSearchStart) || 1
    const end = Number.parseInt(subnetSearchEnd) || start

    // Validate search range
    if (start < 1 || end < 1) {
      setError("Subnet numbers must be positive")
      return
    }

    if (start > results.length || end > results.length) {
      setError(`Subnet numbers must be between 1 and ${results.length}`)
      return
    }

    if (start > end) {
      setError("Start subnet must be less than or equal to end subnet")
      return
    }

    setError("")

    // Filter results
    const filtered = results.filter((subnet) => {
      const position = subnet.position || 0
      return position >= start && position <= end
    })

    setFilteredResults(filtered)
    setIsSearching(true)
  }

  // Clear subnet search
  const clearSearch = () => {
    setFilteredResults(results)
    setSubnetSearchStart("")
    setSubnetSearchEnd("")
    setIsSearching(false)
  }

  // Get calculation explanation for tooltips
  const getCalculationExplanation = (field: string, subnet?: Subnet): string => {
    switch (field) {
      case "networkAddress":
        return "Network address is the first address in the subnet range. It identifies the subnet and cannot be assigned to a host."
      case "broadcast":
        return "Broadcast address is the last address in the subnet range. It is used to send data to all hosts in the subnet and cannot be assigned to a host."
      case "firstUsable":
        return "First usable address is the network address + 1. It's the first address that can be assigned to a host."
      case "lastUsable":
        return "Last usable address is the broadcast address - 1. It's the last address that can be assigned to a host."
      case "subnetMask":
        return "Subnet mask defines which portion of the IP address is the network ID and which portion is the host ID."
      case "cidr":
        return "CIDR (Classless Inter-Domain Routing) notation represents the subnet mask as a single number, indicating the number of bits used for the network portion."
      case "allocatedHosts":
        return "Usable hosts is the number of addresses that can be assigned to devices. It's calculated as 2^(host bits) - 2 (subtracting network and broadcast addresses)."
      case "totalIPs":
        return "Total IPs is the total number of addresses in the subnet, including network and broadcast addresses. It's calculated as 2^(host bits)."
      case "wastedIPs":
        if (subnet) {
          return `Wasted IPs is the difference between allocated hosts (${subnet.allocatedHosts}) and required hosts (${subnet.requiredHosts}). This happens because subnet sizes must be powers of 2.`
        }
        return "Wasted IPs is the difference between allocated hosts and required hosts. This happens because subnet sizes must be powers of 2."
      case "delta":
        return "Delta is the increment between subnets in the same octet. It helps in quickly calculating the next subnet address."
      case "borrowedBits":
        return "Borrowed bits are taken from the host portion of the original network to create subnets. More borrowed bits means more subnets but fewer hosts per subnet."
      case "subnetIncrement":
        return "Subnet increment is the value by which subnet addresses increase. It's calculated as 2^(32 - new prefix) and helps in determining the next subnet address."
      case "subnetBits":
        return "Subnet bits are the bits borrowed from the host portion to create subnets. The number of subnets possible is 2^(subnet bits)."
      case "hostBits":
        return "Host bits are the bits used to identify hosts within a subnet. The number of hosts possible is 2^(host bits) - 2."
      case "totalSubnets":
        return "Total subnets is the maximum number of subnets that can be created with the given borrowed bits. It's calculated as 2^(borrowed bits)."
      default:
        return "No explanation available."
    }
  }

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Column 1, Row 1: VLSM Calculator */}
        <div className="lg:col-span-1">
          <div className="relative">
            {/* Pattern background */}
            <div className="absolute inset-0 bg-grid-pattern opacity-5 -z-10 rounded-xl"></div>

            <Card
              id="vlsm-calculator"
              className="shadow-xl border-t border-l border-r border-b border-gray-200 dark:border-gray-700"
            >
              <CardHeader>
                <CardTitle>IP Subnet Calculator</CardTitle>
                <CardDescription>Calculate subnets based on your requirements</CardDescription>
              </CardHeader>
              <CardContent>
                {error && (
                  <div className="mb-4 p-3 bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100 rounded-md">
                    {error}
                  </div>
                )}

                <Tabs
                  defaultValue="vlsm"
                  value={mode}
                  onValueChange={(value) => setMode(value as "vlsm" | "subnetting")}
                  className="mb-6"
                >
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="vlsm">VLSM Mode</TabsTrigger>
                    <TabsTrigger value="subnetting">Subnetting Mode</TabsTrigger>
                  </TabsList>
                  <TabsContent value="vlsm" className="mt-4">
                    <p className="text-sm text-muted-foreground mb-4">
                      Variable Length Subnet Masking (VLSM) allows you to create subnets of different sizes based on
                      host requirements.
                    </p>
                  </TabsContent>
                  <TabsContent value="subnetting" className="mt-4">
                    <p className="text-sm text-muted-foreground mb-4">
                      Subnetting mode creates equal-sized subnets based on the number of subnets required.
                    </p>
                  </TabsContent>
                </Tabs>

                <div className="space-y-6">
                  {/* IP Address Input */}
                  <div id="ip-input-section">
                    <Label htmlFor="ip-part-0" className="text-base font-medium mb-2 block">
                      IP Address
                    </Label>
                    <div className="flex flex-wrap items-center gap-1">
                      <div className="flex items-center">
                        {ipParts.map((part, index) => (
                          <div key={index} className="flex items-center">
                            <Input
                              id={`ip-part-${index}`}
                              value={part}
                              onChange={(e) => handleIpChange(index, e.target.value)}
                              onKeyDown={(e) => handleIpKeyDown(index, e)}
                              className="w-14 text-center"
                              maxLength={3}
                            />
                            {index < 3 && <span className="mx-1 text-lg">.</span>}
                          </div>
                        ))}
                      </div>
                      <div className="flex items-center mt-2 sm:mt-0">
                        <span className="mx-2 text-lg">/</span>
                        <Input
                          id="cidr-input"
                          value={cidr}
                          onChange={(e) => handleCidrChange(e.target.value)}
                          className="w-16 text-center"
                          maxLength={2}
                          placeholder="Prefix"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Original IP Details */}
                  {originalIPDetails && (
                    <div
                      id="original-ip-details"
                      className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border dark:border-gray-700"
                    >
                      <h3 className="font-medium text-base mb-2">Original IP Details</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="hover:bg-gray-100 dark:hover:bg-gray-700 p-1 rounded">
                                <span className="font-medium">Network Address:</span> {originalIPDetails.networkAddress}
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="max-w-xs">{getCalculationExplanation("networkAddress")}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>

                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="hover:bg-gray-100 dark:hover:bg-gray-700 p-1 rounded">
                                <span className="font-medium">Broadcast Address:</span> {originalIPDetails.broadcast}
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="max-w-xs">{getCalculationExplanation("broadcast")}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>

                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="hover:bg-gray-100 dark:hover:bg-gray-700 p-1 rounded">
                                <span className="font-medium">First Usable:</span> {originalIPDetails.firstUsable}
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="max-w-xs">{getCalculationExplanation("firstUsable")}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>

                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="hover:bg-gray-100 dark:hover:bg-gray-700 p-1 rounded">
                                <span className="font-medium">Last Usable:</span> {originalIPDetails.lastUsable}
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="max-w-xs">{getCalculationExplanation("lastUsable")}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>

                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="hover:bg-gray-100 dark:hover:bg-gray-700 p-1 rounded">
                                <span className="font-medium">Subnet Mask:</span> {originalIPDetails.subnetMask}
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="max-w-xs">{getCalculationExplanation("subnetMask")}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>

                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="hover:bg-gray-100 dark:hover:bg-gray-700 p-1 rounded">
                                <span className="font-medium">Total IPs:</span>{" "}
                                {originalIPDetails.totalIPs.toLocaleString()}
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="max-w-xs">{getCalculationExplanation("totalIPs")}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>

                        {originalIPDetails.delta !== undefined && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="hover:bg-gray-100 dark:hover:bg-gray-700 p-1 rounded">
                                  <span className="font-medium">Delta:</span> {originalIPDetails.delta}
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="max-w-xs">{getCalculationExplanation("delta")}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}

                        {mode === "subnetting" && originalIPDetails.subnetIncrement !== undefined && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="hover:bg-gray-100 dark:hover:bg-gray-700 p-1 rounded font-semibold text-primary">
                                  <span className="font-medium">Subnet Increment:</span>{" "}
                                  {originalIPDetails.subnetIncrement}
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="max-w-xs">{getCalculationExplanation("subnetIncrement")}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}

                        {mode === "subnetting" && originalIPDetails.borrowedBits !== undefined && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="hover:bg-gray-100 dark:hover:bg-gray-700 p-1 rounded font-semibold text-primary">
                                  <span className="font-medium">Borrowed Bits:</span> {originalIPDetails.borrowedBits}
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="max-w-xs">{getCalculationExplanation("borrowedBits")}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}

                        {mode === "subnetting" && originalIPDetails.subnetBits !== undefined && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="hover:bg-gray-100 dark:hover:bg-gray-700 p-1 rounded">
                                  <span className="font-medium">Subnet Bits:</span> {originalIPDetails.subnetBits}
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="max-w-xs">{getCalculationExplanation("subnetBits")}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}

                        {mode === "subnetting" && originalIPDetails.hostBits !== undefined && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="hover:bg-gray-100 dark:hover:bg-gray-700 p-1 rounded">
                                  <span className="font-medium">Host Bits:</span> {originalIPDetails.hostBits}
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="max-w-xs">{getCalculationExplanation("hostBits")}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}

                        {mode === "subnetting" && originalIPDetails.totalSubnets !== undefined && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="hover:bg-gray-100 dark:hover:bg-gray-700 p-1 rounded">
                                  <span className="font-medium">Total Subnets:</span> {originalIPDetails.totalSubnets}
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="max-w-xs">{getCalculationExplanation("totalSubnets")}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Mode-specific inputs */}
                  {mode === "vlsm" ? (
                    <div id="subnet-requirements-section">
                      <div className="flex justify-between items-center mb-2">
                        <Label className="text-base font-medium">Subnet Requirements</Label>
                        <Button variant="outline" size="sm" onClick={addSubnet} id="add-subnet-btn">
                          <Plus className="h-4 w-4 mr-1" /> Add Subnet
                        </Button>
                      </div>

                      <div className="space-y-3 mb-4">
                        {subnets.map((subnet, index) => (
                          <div key={subnet.id} className="flex items-center gap-3">
                            <Input
                              id={`subnet-name-${subnet.id}`}
                              value={subnet.name}
                              onChange={(e) => updateSubnet(subnet.id, "name", e.target.value)}
                              className="flex-1"
                              placeholder="Subnet Name"
                            />
                            <div className="flex-1">
                              <Input
                                id={`subnet-hosts-${subnet.id}`}
                                type="number"
                                min="1"
                                value={subnet.requiredHosts || ""}
                                onChange={(e) =>
                                  updateSubnet(subnet.id, "requiredHosts", Number.parseInt(e.target.value) || 0)
                                }
                                className="w-full"
                                placeholder="Required Hosts"
                              />
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeSubnet(subnet.id)}
                              disabled={subnets.length <= 1}
                              id={`remove-subnet-${subnet.id}`}
                              className={cn(
                                "text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900 dark:hover:text-red-300",
                                subnets.length <= 1 && "opacity-50 cursor-not-allowed",
                              )}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div id="subnetting-input-section">
                      <Label htmlFor="num-subnets" className="text-base font-medium mb-2 block">
                        Number of Subnets
                      </Label>
                      <Input
                        id="num-subnets"
                        type="number"
                        min="1"
                        value={numSubnets}
                        onChange={(e) => handleNumSubnetsChange(e.target.value)}
                        className="w-full"
                        placeholder="Enter number of subnets"
                      />
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-3">
                <Button onClick={generateRandom} className="w-full" variant="secondary" id="generate-random-btn">
                  <Dices className="h-4 w-4 mr-2" /> Generate Random
                </Button>
                <Button onClick={calculateVLSM} className="w-full" id="calculate-btn">
                  <Calculator className="h-4 w-4 mr-2" /> Calculate
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>

        {/* Column 2, Row 1: VLSM Results */}
        <div className="lg:col-span-2">
          <Card className="shadow-lg dark:border-gray-700 h-full" id="results-section">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>{mode === "vlsm" ? "VLSM Results" : "Subnetting Results"}</CardTitle>
                <CardDescription>Subnet allocation based on your requirements</CardDescription>
              </div>

              {mode === "subnetting" && results.length > 0 && (
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <Input
                      placeholder="Start"
                      value={subnetSearchStart}
                      onChange={(e) => setSubnetSearchStart(e.target.value)}
                      className="w-20"
                    />
                    <span>-</span>
                    <Input
                      placeholder="End"
                      value={subnetSearchEnd}
                      onChange={(e) => setSubnetSearchEnd(e.target.value)}
                      className="w-20"
                    />
                  </div>
                  <Button variant="outline" size="sm" onClick={searchSubnets}>
                    <Search className="h-4 w-4 mr-1" /> Search
                  </Button>
                  {isSearching && (
                    <Button variant="ghost" size="sm" onClick={clearSearch}>
                      Clear
                    </Button>
                  )}
                </div>
              )}
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Subnet Name</TableHead>
                      <TableHead>Network Address</TableHead>
                      <TableHead>Subnet Mask</TableHead>
                      <TableHead>Prefix</TableHead>
                      <TableHead>First Usable</TableHead>
                      <TableHead>Last Usable</TableHead>
                      <TableHead>Broadcast</TableHead>
                      <TableHead>Usable Hosts</TableHead>
                      <TableHead>Total IPs</TableHead>
                      <TableHead>Wasted IPs</TableHead>
                      <TableHead>Delta</TableHead>
                      <TableHead>Borrowed Bits</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredResults.length > 0 ? (
                      filteredResults.map((subnet) => (
                        <TableRow key={subnet.id}>
                          <TableCell className="font-medium">{subnet.name}</TableCell>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <TableCell className="hover:bg-gray-100 dark:hover:bg-gray-800 cursor-help">
                                  {subnet.networkAddress}
                                </TableCell>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="max-w-xs">{getCalculationExplanation("networkAddress")}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <TableCell className="hover:bg-gray-100 dark:hover:bg-gray-800 cursor-help">
                                  <div>{subnet.subnetMask}</div>
                                  <div className="text-xs font-mono text-gray-600 dark:text-gray-400 mt-1">
                                    {subnet.subnetMaskBinary}
                                  </div>
                                </TableCell>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="max-w-xs">{getCalculationExplanation("subnetMask")}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <TableCell className="hover:bg-gray-100 dark:hover:bg-gray-800 cursor-help">
                                  /{subnet.cidr}
                                </TableCell>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="max-w-xs">{getCalculationExplanation("cidr")}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <TableCell className="hover:bg-gray-100 dark:hover:bg-gray-800 cursor-help">
                                  {subnet.firstUsable}
                                </TableCell>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="max-w-xs">{getCalculationExplanation("firstUsable")}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <TableCell className="hover:bg-gray-100 dark:hover:bg-gray-800 cursor-help">
                                  {subnet.lastUsable}
                                </TableCell>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="max-w-xs">{getCalculationExplanation("lastUsable")}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <TableCell className="hover:bg-gray-100 dark:hover:bg-gray-800 cursor-help">
                                  {subnet.broadcast}
                                </TableCell>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="max-w-xs">{getCalculationExplanation("broadcast")}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <TableCell className="hover:bg-gray-100 dark:hover:bg-gray-800 cursor-help">
                                  {subnet.allocatedHosts}
                                </TableCell>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="max-w-xs">{getCalculationExplanation("allocatedHosts")}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <TableCell className="hover:bg-gray-100 dark:hover:bg-gray-800 cursor-help">
                                  {subnet.totalIPs?.toLocaleString()}
                                </TableCell>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="max-w-xs">{getCalculationExplanation("totalIPs")}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <TableCell className="hover:bg-gray-100 dark:hover:bg-gray-800 cursor-help">
                                  {subnet.allocatedHosts - subnet.requiredHosts}
                                </TableCell>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="max-w-xs">{getCalculationExplanation("wastedIPs", subnet)}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <TableCell className="hover:bg-gray-100 dark:hover:bg-gray-800 cursor-help">
                                  {subnet.delta !== undefined ? subnet.delta : "-"}
                                </TableCell>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="max-w-xs">{getCalculationExplanation("delta")}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <TableCell className="hover:bg-gray-100 dark:hover:bg-gray-800 cursor-help">
                                  {subnet.borrowedBits}
                                </TableCell>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="max-w-xs">{getCalculationExplanation("borrowedBits")}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={12} className="text-center py-8 text-muted-foreground">
                          No results to display. Enter your subnet requirements and calculate.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Column 1, Row 2: History */}
        <div className="lg:col-span-1">
          <Card className="shadow-lg dark:border-gray-700 h-full">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="h-5 w-5 mr-2" /> Calculation History
              </CardTitle>
              <CardDescription>Previous calculations</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px] pr-4">
                {history.length > 0 ? (
                  <div className="space-y-3">
                    {history.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => loadHistoryItem(item)}
                        className="p-3 border rounded-md cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-medium">
                              {item.ipAddress}/{item.cidr}
                            </div>
                            <div className="text-sm text-muted-foreground">{formatDate(item.timestamp)}</div>
                            <div className="text-sm mt-1">
                              {item.mode === "vlsm"
                                ? `${item.subnets.length} subnet${item.subnets.length !== 1 ? "s" : ""}`
                                : `${item.numSubnets} equal subnet${item.numSubnets !== 1 ? "s" : ""}`}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              {item.mode === "vlsm" ? "VLSM Mode" : "Subnetting Mode"}
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-muted-foreground hover:text-red-500"
                            onClick={(e) => deleteHistoryItem(item.id, e)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No calculation history yet. Your calculations will appear here.
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Column 2, Row 2: Reference Tables */}
        <div className="lg:col-span-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Powers of 2 Table */}
            <Card className="shadow-md dark:border-gray-700">
              <CardHeader>
                <CardTitle className="text-lg">Powers of 2 Reference</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Power</TableHead>
                      <TableHead>Value</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((power) => (
                      <TableRow key={power}>
                        <TableCell>
                          2<sup>{power}</sup>
                        </TableCell>
                        <TableCell>{Math.pow(2, power).toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Byte Values Table */}
            <Card className="shadow-md dark:border-gray-700">
              <CardHeader>
                <CardTitle className="text-lg">Byte Values Reference</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Binary</TableHead>
                      <TableHead>Decimal</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-mono">10000000</TableCell>
                      <TableCell>128</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-mono">11000000</TableCell>
                      <TableCell>192</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-mono">11100000</TableCell>
                      <TableCell>224</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-mono">11110000</TableCell>
                      <TableCell>240</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-mono">11111000</TableCell>
                      <TableCell>248</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-mono">11111100</TableCell>
                      <TableCell>252</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-mono">11111110</TableCell>
                      <TableCell>254</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-mono">11111111</TableCell>
                      <TableCell>255</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Theme Toggle and Footer */}
      <div className="mt-8 flex flex-col items-center justify-center gap-4">
        <ThemeToggle />
        <footer className="text-center text-sm text-muted-foreground pb-6">
          Created by{" "}
          <a
            href="https://devliqht.vercel.app"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-primary hover:underline"
          >
            Matt Cabarrubias
          </a>{" "}
          with v0
        </footer>
      </div>
    </div>
  )
}

