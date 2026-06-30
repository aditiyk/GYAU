import { useState, useEffect, useRef } from 'react'
import { Mic, Plus, Calendar, Activity, CheckCircle2, ChevronRight, RefreshCw, Clock, Sparkles, Edit2, Trash2, FileUp, ImageUp, Database, PieChart, X } from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import { useGoogleLogin } from '@react-oauth/google'
import Login from './components/Login'
import Signup from './components/Signup'
import ProfileMenu from './components/ProfileMenu'
import AnimatedButton from './components/AnimatedButton'
import mascot1 from './assets/mascot1.1.png'
import mascot2 from './assets/mascot2.2.png'
import mascot3 from './assets/mascot3.3.png'
import mascot5 from './assets/mascot5.5.png'
import gayu1 from './assets/gayu1.png'
import gayu2 from './assets/gayu2.png'
import gayu3 from './assets/gayu3.png'
import { AIHelpersModal } from './components/AIHelpersModal'
import desk1 from './assets/desk1.png'
import clouds1 from './assets/clouds1.png'
import cupIcon from './assets/icons/cup1.png'
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts'
import ProtectedRoute from './components/ProtectedRoute'
import { PlanDayModal } from './components/PlanDayModal'
import { BreakTaskModal } from './components/BreakTaskModal'
import { RevisionPlanModal } from './components/RevisionPlanModal'
import { AddTaskModal } from './components/AddTaskModal'

const formatTime = (minutes: number) => {
  if (!minutes) return '0h 0m'
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${h}h ${m}m`
}

interface Task {
  _id?: string;
  id?: number;
  title: string;
  category: string;
  fixed_or_flexible: string;
  completed: boolean;
  priority?: string;
  icon?: string;
  deadline?: string | null;
  importance?: number;
  estimated_hours?: number;
  priority_label?: string;
}

interface CalendarEvent {
  _id?: string;
  title: string;
  start_time: string;
  end_time: string;
  source?: string;
  task_id?: string;
  date?: string;
}

interface Payment {
  merchant: string;
  amount: number;
  due_date: string;
  status: string;
}

function Dashboard() {
  const { token, logout, isGuest } = useAuth();
  const navigate = useNavigate();

  const apiFetch = async (url: string, options: RequestInit = {}) => {
    const headers = new Headers(options.headers || {});
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    const res = await fetch(url, { ...options, headers });
    if (res.status === 401) {
      logout();
    }
    return res;
  };

  const [tasks, setTasks] = useState<{ big: Task[], small: Task[], personal: Task[] }>({
    big: [],
    small: [],
    personal: []
  })
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([])
  useEffect(() => {
    console.log("CALENDAR EVENTS:", calendarEvents)
  }, [calendarEvents])
  const [payments, setPayments] = useState<Payment[]>([])
  const [gayuMessage, setGayuMessage] = useState("I-It’s not like I missed you. Now focus.")
  const [, setHasError] = useState(false)
  const [, setMascotState] = useState<any>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [taskInput, setTaskInput] = useState("")
  const [focusMode, setFocusMode] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('Home')
  const lastGeminiCall = useRef<number>(0)
  const [analyticsInsights, setAnalyticsInsights] = useState<any>(null)
  const [analyticsChart, setAnalyticsChart] = useState<any>(null)
  const [radarData, setRadarData] = useState<any>(null)
  const [generatedSchedule, setGeneratedSchedule] = useState<any[]>([])
  const [plannerInsights, setPlannerInsights] = useState<string[]>([])
  const [plannerMemory, setPlannerMemory] = useState<any[]>([])
  const [isManageImportsOpen, setIsManageImportsOpen] = useState(false)
  const [gmailData, setGmailData] = useState<any>(null)
  const [isSimulatedLoginOpen, setIsSimulatedLoginOpen] = useState(false)

  const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'gayu', text: string }[]>([])
  const [isPlusMenuOpen, setIsPlusMenuOpen] = useState(false)
  const [isAIHelpersModalOpen, setIsAIHelpersModalOpen] = useState(false)
  const [isPlanDayOpen, setIsPlanDayOpen] = useState(false)
  const [isBreakTaskOpen, setIsBreakTaskOpen] = useState(false)
  const [isRevisionPlanOpen, setIsRevisionPlanOpen] = useState(false)
  const [isTalkDrawerOpen, setIsTalkDrawerOpen] = useState(false)
  const [talkMode, setTalkMode] = useState<'normal' | 'study'>('normal')
  const [talkModalTab, setTalkModalTab] = useState<'Text' | 'Voice'>('Text')
  const [talkInputText, setTalkInputText] = useState("")
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])

  const [breakTaskLoading, setBreakTaskLoading] = useState(false)
  const [generatedSubtasks, setGeneratedSubtasks] = useState<any[] | null>(null)
  const [planDayLoading, setPlanDayLoading] = useState(false)
  const [revisionPlanLoading, setRevisionPlanLoading] = useState(false)
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false)

  // Task management state
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null)
  const [editingTaskTitle, setEditingTaskTitle] = useState("")
  // No inline states needed

  const taskInputRef = useRef<HTMLInputElement>(null)

  const API_BASE = "http://localhost:8000"

  const handleCalendarSync = useGoogleLogin({
    scope: 'https://www.googleapis.com/auth/calendar.readonly',
    onSuccess: async (tokenResponse) => {
      const toastId = toast.loading("Syncing calendar...", { id: "cal-sync" });
      try {
        const res = await apiFetch(`${API_BASE}/calendar/connect`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ access_token: tokenResponse.access_token })
        });
        if (res.ok) {
          toast.success("Calendar synced successfully!", { id: toastId });
          fetchData();
        } else {
          toast.error("Failed to sync calendar", { id: toastId });
        }
      } catch (err) {
        toast.error("Error syncing calendar", { id: toastId });
      }
    },
    onError: () => {
      toast.error("Failed to connect Google Calendar");
    }
  });

  // Mascot updates based on actions only, not navigation




  // Fetch initial data
  const fetchData = async () => {
    try {
      console.log("[API REQUEST] Fetching dashboard data")
      // 1. Fetch tasks
      const tasksRes = await apiFetch(`${API_BASE}/tasks/`)
      if (tasksRes.ok) {
        const tasksData: Task[] = await tasksRes.json()
        const big = tasksData.filter(t => t.category.toLowerCase() === 'big')
        const small = tasksData.filter(t => t.category.toLowerCase() === 'small')
        const personal = tasksData.filter(t => t.category.toLowerCase() === 'personal')
        setTasks({ big, small, personal })
      } else {
        console.error("[API FAILED] GET /tasks/", await tasksRes.text())
        toast.error("Failed to load tasks")
      }

      // 2. Fetch calendar events
      const calRes = await apiFetch(`${API_BASE}/calendar/events`)
      if (calRes.ok) {
        const calData = await calRes.json()
        setCalendarEvents(calData)
      } else {
        console.error("[API FAILED] GET /calendar/events", await calRes.text())
        toast.error("Failed to load calendar events")
      }

      // 3. Fetch payments
      const payRes = await apiFetch(`${API_BASE}/payments/`)
      if (payRes.ok) {
        const payData = await payRes.json()
        setPayments(payData)
      } else {
        console.error("[API FAILED] GET /payments/", await payRes.text())
        toast.error("Failed to load payments")
      }

      // 4. Fetch Analytics
      try {
        const insightsRes = await apiFetch(`${API_BASE}/analytics/insights`)
        if (insightsRes.ok) setAnalyticsInsights(await insightsRes.json())

        const chartRes = await apiFetch(`${API_BASE}/analytics/chart-data`)
        if (chartRes.ok) setAnalyticsChart(await chartRes.json())

        const radarRes = await apiFetch(`${API_BASE}/analytics/radar`)
        if (radarRes.ok) setRadarData(await radarRes.json())
      } catch (e) {
        console.error("Analytics fetch error:", e)
      }

      // 5. Fetch Gmail
      const gmailRes = await apiFetch(`${API_BASE}/gmail/unread`)
      if (gmailRes.ok) {
        setGmailData(await gmailRes.json())
      }

      // 6. Fetch Planner Memory
      const memRes = await apiFetch(`${API_BASE}/planner/memory`)
      if (memRes.ok) {
        const m = await memRes.json()
        setPlannerMemory(m.imports || [])
      }

      console.log("[API SUCCESS] Dashboard data loaded")
    } catch (e) {
      console.error("[API FAILED] Failed to load backend data, using fallback", e)
      toast.error("Network error fetching dashboard data")
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  // Call the Orchestrator Agent
  const triggerOrchestrate = async (customFocus?: boolean) => {
    console.log("[CLICK] triggerOrchestrate (Ask Gayu)")
    const now = Date.now()
    if (now - lastGeminiCall.current < 30000) {
      setGayuMessage("Tch... you're asking too much. Wait a bit before bothering me again, idiot.")
      setMascotState(mascot2)
      return
    }

    setIsLoading(true)
    setHasError(false)

    try {
      lastGeminiCall.current = Date.now()
      console.log("[API REQUEST] POST /agent/orchestrate")
      const res = await apiFetch(`${API_BASE}/agent/orchestrate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ focus_mode: (customFocus ?? focusMode) ? "Active" : "Inactive" })
      })

      if (res.status === 429) {
        console.error("[API FAILED] 429 Too Many Requests")
        setGayuMessage("Tch... you're asking too much. Wait a bit before bothering me again, idiot.")
        setMascotState(mascot2)
        setHasError(true)
        toast.error("Rate limit reached. Try again later.")
        return
      }

      if (res.ok) {
        const data = await res.json()
        if (data.success === false && data.error_type === "quota_exceeded") {
          console.error("[API FAILED] Quota Exceeded handled via JSON")
          setGayuMessage("Hmph… I’m out of energy right now. Try again in a little while.")
          setMascotState(mascot2)
          setHasError(true)
          toast.error("Rate limit reached. Try again later.")
          return
        }
        console.log("[API SUCCESS] POST /agent/orchestrate", data)
        setGayuMessage(data.gayu_response || "Looks like we are all set!")

        // Conditionally update mascot image
        const trigger = data.evaluator_output || ""
        const finalAction = data.final_action || ""
        if (trigger.toLowerCase().includes("distract") || finalAction.toLowerCase().includes("intervention") || trigger.toLowerCase().includes("youtube")) {
          setMascotState(mascot2) // Tsundere / Distraction
        } else if (trigger.toLowerCase().includes("plan") || data.planner_output) {
          setMascotState(mascot1) // Planning
        } else if ((customFocus ?? focusMode)) {
          setMascotState(mascot5) // Focus Mode
        } else {
          setMascotState(mascot1) // Greeting / Friendly
        }
        toast.success("Agent finished planning!")
      } else {
        console.error("[API FAILED]", await res.text())
        setHasError(true)
        toast.error("Agent failed to respond")
      }
    } catch (e) {
      console.error("[API FAILED]", e)
      setHasError(true)
      toast.error("Network error triggering agent")
    } finally {
      setIsLoading(false)
    }
  }

  const classifyTask = (title: string): 'Big' | 'Small' | 'Personal' => {
    const lower = title.toLowerCase();
    const isPersonal = /(eat|lunch|dinner|water|gym|sleep|walk|mom|health|meal|family|errand|self-care)/.test(lower);
    const isBig = /(write|prepare|project|report|assignment|exam|study|deep work)/.test(lower);
    const isSmall = /(pay|send|reply|submit|book|email|call|admin|quick|short)/.test(lower);

    if (isPersonal) return 'Personal';
    if (isBig) return 'Big';
    if (isSmall) return 'Small';

    return 'Small'; // Default
  };

  // Handle adding task (simple)
  const handleAddTask = async () => {
    console.log("[CLICK] handleAddTask")
    if (!taskInput.trim()) {
      taskInputRef.current?.focus();
      return;
    }
    await handleAdvancedAddTask(taskInput, "", 1, 3);
  }

  // Handle advanced adding task
  const handleAdvancedAddTask = async (title: string, deadline: string, duration: number, importance: number) => {
    const category = classifyTask(title)
    const isFixed = category === 'Big'
    const newTask = {
      title: title,
      category: category,
      fixed_or_flexible: isFixed ? "Fixed" : "Flexible",
      completed: false,
      deadline: deadline || null,
      estimated_hours: duration,
      importance: importance
    }

    try {
      const res = await apiFetch(`${API_BASE}/tasks/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTask)
      })
      if (res.ok) {
        setTaskInput("")
        setIsAddTaskOpen(false)
        await fetchData()
        toast.success(`Task added: ${title}`)
        setMascotState(category === 'Big' ? mascot5 : mascot1)
      } else {
        const errText = await res.text()
        console.error("API error adding task:", errText)
        try {
          const errData = JSON.parse(errText)
          toast.error(`Failed: ${errData.detail || 'Unknown error'}`)
        } catch {
          toast.error(`Failed to add task`)
        }
      }
    } catch (e) {
      toast.error("Network error adding task")
    }
  }

  // Handle checkbox check / completion
  const handleToggleTask = async (id: string | undefined, currentCompleted: boolean) => {
    console.log(`[CLICK] handleToggleTask (id: ${id}, completed: ${!currentCompleted})`)
    if (!id) return
    try {
      console.log(`[API REQUEST] PATCH /tasks/${id}`)
      const res = await apiFetch(`${API_BASE}/tasks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: !currentCompleted })
      })
      if (res.ok) {
        console.log(`[API SUCCESS] PATCH /tasks/${id}`)
        await fetchData()
        setMascotState(mascot3) // Celebratory or friendly greeting update
        setGayuMessage("Good job... I guess. Don't let it go to your head.")
      } else {
        console.error(`[API FAILED] PATCH /tasks/${id}`, await res.text())
        toast.error("Failed to update task status")
      }
    } catch (e) {
      console.error("[API FAILED]", e)
      toast.error("Network error updating task")
    }
  }

  const handleDeleteTask = async (id: string | undefined) => {
    if (!id) return
    try {
      console.log(`[API REQUEST] DELETE /tasks/${id}`)
      const res = await apiFetch(`${API_BASE}/tasks/${id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success("Task deleted")
        await fetchData()
      } else {
        toast.error("Failed to delete task")
      }
    } catch (e) {
      toast.error("Network error deleting task")
    }
  }

  const handleSaveTask = async (id: string | undefined) => {
    if (!id) return
    try {
      const res = await apiFetch(`${API_BASE}/tasks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: editingTaskTitle })
      })
      if (res.ok) {
        setEditingTaskId(null)
        setEditingTaskTitle("")
        toast.success("Task updated")
        await fetchData()
      } else {
        toast.error("Failed to update task")
      }
    } catch (e) {
      toast.error("Network error updating task")
    }
  }

  // Talk to Gayu logic
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        stream.getTracks().forEach(track => track.stop())
        setIsLoading(true)
        try {
          const formData = new FormData()
          formData.append("audio", audioBlob)
          const res = await apiFetch(`${API_BASE}/voice/transcribe`, {
            method: 'POST',
            body: formData
          })
          if (res.ok) {
            const data = await res.json()
            if (data.transcription) {
              setTalkInputText(`🎤 ${data.transcription}`)
              setTalkModalTab('Text')
            } else {
              toast.error("Could not transcribe.")
            }
          } else {
            toast.error("Transcription failed.")
          }
        } catch (e) {
          console.error("Transcription failed", e)
          toast.error("Failed to transcribe audio.")
        } finally {
          setIsLoading(false)
        }
      }

      mediaRecorder.start()
      setIsRecording(true)
    } catch (e) {
      toast.error("Microphone access denied")
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }

  const handleTalkSubmit = async (payload: string) => {
    const now = Date.now()
    if (now - lastGeminiCall.current < 30000) {
      setGayuMessage("Tch... you're asking too much. Wait a bit before bothering me again, idiot.")
      return
    }

    const userMessage = payload;
    setChatHistory(prev => [...prev, { role: 'user', text: userMessage }])

    lastGeminiCall.current = Date.now()
    setIsLoading(true)
    setIsTalkDrawerOpen(true)

    try {
      const formData = new FormData()
      formData.append("text_prompt", payload)

      if (talkMode === 'study') {
        formData.append("mode", "study");
        // We will call the ai helper service for study mode
        const res = await apiFetch(`${API_BASE}/ai/study`, {
          method: 'POST',
          body: formData
        })
        if (res.ok) {
          const data = await res.json()
          setChatHistory(prev => [...prev, { role: 'gayu', text: data.response || "..." }])
          setGayuMessage(data.response || "Here's your study advice.");
        } else {
          toast.error("Failed to talk to Gayu");
        }
      } else {
        const res = await apiFetch(`${API_BASE}/voice/process`, {
          method: 'POST',
          body: formData
        })

        if (res.ok) {
          const data = await res.json()
          if (data.agent_response?.success === false && data.agent_response?.error_type === "quota_exceeded") {
            setGayuMessage("Hmph… I’m out of energy right now. Try again in a little while.")
            setMascotState(mascot2)
            toast.error("Rate limit reached. Try again later.")
            return
          }

          setChatHistory(prev => [...prev, { role: 'gayu', text: data.agent_response?.gayu_response || "Looks like I have nothing to say." }])

          const trigger = data.agent_response?.evaluator_output || ""
          const finalAction = data.agent_response?.final_action || ""
          if (trigger.toLowerCase().includes("distract") || finalAction.toLowerCase().includes("intervention") || trigger.toLowerCase().includes("youtube")) {
            setMascotState(mascot2)
          } else if (trigger.toLowerCase().includes("plan") || data.agent_response?.planner_output) {
            setMascotState(mascot1)
          } else {
            setMascotState(mascot1)
          }

          toast.success("Talk processed!")
          await fetchData()
        } else {
          toast.error("Failed to process conversation")
        }
      }
    } catch (e) {
      console.error("[API FAILED]", e)
      toast.error("Network error talking to Gayu")
    } finally {
      setIsLoading(false)
      setTalkInputText("")
    }
  }

  const handleBreakTask = async (description: string) => {
    setBreakTaskLoading(true);
    try {
      const res = await apiFetch(`${API_BASE}/ai/break-task`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description })
      });
      if (!res.ok) throw new Error("Failed to break down task");
      const data = await res.json();
      if (data.subtasks) {
        setGeneratedSubtasks(data.subtasks);
      }
    } catch (e) {
      toast.error("Failed to break down task");
    } finally {
      setBreakTaskLoading(false);
    }
  };

  const handleAcceptSubtasks = async (subtasks: any[]) => {
    for (const sub of subtasks) {
      await apiFetch(`${API_BASE}/tasks/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: sub.title, duration: (sub.estimated_hours || 1) * 60, category: "Small", fixed_or_flexible: "Flexible" })
      });
    }
    await fetchData();
    setIsBreakTaskOpen(false);
    setGeneratedSubtasks(null);
    toast.success("Subtasks added!");
  };

  const handlePlanDay = async (data: any) => {
    setPlanDayLoading(true);
    const toastId = toast.loading("Gayu is planning your day...", { id: "planday" });
    try {
      const res = await apiFetch(`${API_BASE}/ai/plan-day`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error("Failed to plan day");
      const result = await res.json();

      const allTasks = [...tasks.big, ...tasks.small, ...tasks.personal]
        .filter(t => !t.completed)
        .map(t => {
          return {
            title: String(t.title || "Untitled"),
            category: String(t.category || "Small"),
            fixed_or_flexible: "Flexible",
            completed: Boolean(t.completed)
          };
        })

      const genRes = await apiFetch(`${API_BASE}/planner/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tasks: allTasks })
      })
      if (genRes.ok) {
        const { schedule, insights } = await genRes.json()
        setGeneratedSchedule(schedule)
        if (result.suggested_task_order) {
          insights.unshift(`Gayu suggests this order: ${result.suggested_task_order.join(" → ")}`)
        }
        setPlannerInsights(insights)
      }

      setGayuMessage(result.gayu_response || "Here's your schedule!");
      setMascotState(mascot1);
      toast.success("Day planned!", { id: toastId });
      setIsPlanDayOpen(false);
      setActiveTab('Home');
    } catch (e) {
      toast.error("Failed to plan day", { id: toastId });
    } finally {
      setPlanDayLoading(false);
    }
  };

  const handlePrioritize = async () => {
    const toastId = toast.loading("Prioritizing tasks...", { id: "prioritize" });
    try {
      const res = await apiFetch(`${API_BASE}/ai/prioritize`, { method: "POST" });
      if (!res.ok) throw new Error("Failed to prioritize");
      await fetchData();
      toast.success("Tasks prioritized!", { id: toastId });
    } catch (e) {
      toast.error("Failed to prioritize", { id: toastId });
    }
  };

  const handleRevisionPlan = async (data: any) => {
    setRevisionPlanLoading(true);
    const toastId = toast.loading("Building revision plan...", { id: "revision" });
    try {
      const res = await apiFetch(`${API_BASE}/ai/revision-plan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error("Failed to build revision plan");
      const result = await res.json();

      setPlannerInsights([
        "Daily Plan: " + result.daily_plan.join(", "),
        "Revision Cycles: " + result.revision_cycles.join(", "),
        "Mock Test Days: " + result.mock_test_days.join(", ")
      ]);
      toast.success("Revision plan ready!", { id: toastId });
      setIsRevisionPlanOpen(false);
      setActiveTab('Insights');
    } catch (e) {
      toast.error("Failed to build plan", { id: toastId });
    } finally {
      setRevisionPlanLoading(false);
    }
  };

  const toggleFocusMode = async () => {
    console.log("[CLICK] toggleFocusMode")
    const nextMode = !focusMode
    setFocusMode(nextMode)
    setGayuMessage(nextMode ? "Alright, lock in! I'll be watching you..." : "Focus mode off. Don't slack off now.")
    setMascotState(nextMode ? mascot5 : mascot1)
    try {
      const endpoint = nextMode ? "/focus/start" : "/focus/stop"
      console.log(`[API REQUEST] POST ${endpoint}`)
      const res = await apiFetch(`${API_BASE}${endpoint}`, { method: 'POST' })
      if (res.ok) {
        console.log(`[API SUCCESS] POST ${endpoint}`)
        toast.success(nextMode ? "Focus mode activated!" : "Focus mode deactivated")
        await triggerOrchestrate(nextMode)
      } else {
        console.error(`[API FAILED] POST ${endpoint}`, await res.text())
        toast.error("Failed to toggle focus mode")
      }
    } catch (e) {
      console.error("[API FAILED]", e)
      toast.error("Network error toggling focus mode")
    }
  }

  const handleGoogleAuthClick = () => {
    console.log("[CLICK] handleGoogleAuthClick")
    if (isGuest) {
      toast.error("Please sign up or log in to sync cloud accounts!");
      navigate('/login');
      return;
    }
    setIsSimulatedLoginOpen(true)
  }

  const handleSimulatedLogin = () => {
    setIsSimulatedLoginOpen(false)
    toast.promise(
      new Promise(resolve => setTimeout(resolve, 1500)).then(async () => {
        // Mock token
        const res = await apiFetch(`${API_BASE}/calendar/sync`, { method: 'POST' })
        const resGmail = await apiFetch(`${API_BASE}/gmail/unread`)
        if (res.ok && resGmail.ok) {
          setGayuMessage("Fine, I've synced your calendar and email. Try not to miss anything important.")
          setMascotState(mascot1)
          await fetchData()
        } else {
          throw new Error("Failed to sync")
        }
      }),
      {
        loading: 'Authenticating with Google...',
        success: 'Successfully connected Google Account!',
        error: 'Failed to authenticate.',
      }
    )
  }

  const handleUploadAndGenerate = async (e: any) => {
    const file = e.target.files?.[0]
    if (!file) return

    const toastId = toast.loading("Uploading file...", { id: "planner" })
    try {
      const formData = new FormData()
      formData.append("file", file)

      const uploadRes = await apiFetch(`${API_BASE}/planner/upload`, {
        method: "POST",
        body: formData
      })
      if (!uploadRes.ok) {
        let errDetail = "Upload failed"
        try {
          const errData = await uploadRes.json()
          errDetail = errData.detail || errDetail
        } catch (e) { }
        throw new Error(errDetail)
      }

      const resData = await uploadRes.json()
      if (resData.success === false) {
        throw new Error(resData.error || "Could not read timetable image")
      }
      if (resData.imports) {
        setPlannerMemory(resData.imports)
      }

      toast.loading("Generating schedule...", { id: toastId })

      // Sanitize existing uncompleted manual tasks
      const allTasks = [...tasks.big, ...tasks.small, ...tasks.personal]
        .filter(t => !t.completed)
        .map(t => {
          return {
            title: String(t.title || "Untitled"),
            category: String(t.category || "Small"),
            fixed_or_flexible: "Flexible",
            completed: Boolean(t.completed)
          };
        })

      console.log("[DEBUG] Payload to /planner/generate (after upload):", JSON.stringify({ tasks: allTasks }))

      const genRes = await apiFetch(`${API_BASE}/planner/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tasks: allTasks })
      })
      if (!genRes.ok) throw new Error("Generate failed")

      const { schedule, insights } = await genRes.json()
      setGeneratedSchedule(schedule)
      setPlannerInsights(insights)

      // Refresh memory
      const memRes = await apiFetch(`${API_BASE}/planner/memory`)
      if (memRes.ok) {
        const m = await memRes.json()
        setPlannerMemory(m.imports || [])
      }

      toast.success("Schedule ready!", { id: toastId })
    } catch (err: any) {
      console.error(err)
      toast.error(err.message, { id: toastId })
    } finally {
      // Reset input value so the same file can be uploaded again
      e.target.value = ''
    }
  }

  const handleHomeUpload = (e: any) => {
    const file = e.target.files?.[0];
    if (!file) return;
    toast.success(`Uploaded ${file.name} to workspace.`);
    setIsPlusMenuOpen(false);
  }

  const handleToggleImport = async (id: string) => {
    const res = await apiFetch(`${API_BASE}/planner/memory/${id}`, { method: 'PATCH' });
    if (res.ok) {
      const m = await res.json()
      setPlannerMemory(m.imports || [])
      // regenerate schedule if needed? 
      // let's do a simple full generate again
      const allTasks = [...tasks.big, ...tasks.small, ...tasks.personal]
        .filter(t => !t.completed)
        .map(t => {
          return {
            title: String(t.title || "Untitled"),
            category: String(t.category || "Small"),
            fixed_or_flexible: "Flexible",
            completed: Boolean(t.completed)
          };
        })

      console.log("[DEBUG] Payload to /planner/generate (after toggle):", JSON.stringify({ tasks: allTasks }))

      const genRes = await apiFetch(`${API_BASE}/planner/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tasks: allTasks })
      })
      if (genRes.ok) {
        const { schedule, insights } = await genRes.json()
        setGeneratedSchedule(schedule)
        setPlannerInsights(insights)
      }
    }
  }

  const handleDeleteImport = async (id: string) => {
    const res = await apiFetch(`${API_BASE}/planner/memory/${id}`, { method: 'DELETE' });
    if (res.ok) {
      const m = await res.json()
      setPlannerMemory(m.imports || [])

      const allTasks = [...tasks.big, ...tasks.small, ...tasks.personal]
        .filter(t => !t.completed)
        .map(t => {
          return {
            title: String(t.title || "Untitled"),
            category: String(t.category || "Small"),
            fixed_or_flexible: "Flexible",
            completed: Boolean(t.completed)
          };
        })

      const genRes = await apiFetch(`${API_BASE}/planner/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tasks: allTasks })
      })
      if (genRes.ok) {
        const { schedule, insights } = await genRes.json()
        setGeneratedSchedule(schedule)
        setPlannerInsights(insights)
      }
    }
  }

  const handleAutoSchedule = async () => {
    const toastId = toast.loading("Auto-scheduling...", { id: "autoschedule" });
    try {
      const allTasks = [...tasks.big, ...tasks.small, ...tasks.personal]
        .filter(t => !t.completed)
        .map(t => {
          return {
            title: String(t.title || "Untitled"),
            category: String(t.category || "Small"),
            fixed_or_flexible: "Flexible",
            completed: Boolean(t.completed),
            deadline: t.deadline,
            importance: t.importance,
            estimated_hours: t.estimated_hours
          };
        });

      const genRes = await apiFetch(`${API_BASE}/planner/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tasks: allTasks })
      });
      if (genRes.ok) {
        const { schedule, insights } = await genRes.json();
        setGeneratedSchedule(schedule);
        setPlannerInsights(insights);
        toast.success("Schedule optimized!", { id: toastId });
      } else {
        toast.error("Failed to auto-schedule", { id: toastId });
      }
    } catch (e) {
      toast.error("Error auto-scheduling", { id: toastId });
    }
  };

  const renderTask = (t: Task) => (
    <div key={t._id || t.id} className="flex items-start gap-3 bg-white/90 p-3 rounded-xl shadow-sm border border-[#ecf0d0] hover:border-[#ecf0d0] transition-all group relative">
      <input
        type="checkbox"
        checked={t.completed}
        onChange={() => handleToggleTask(t._id, t.completed)}
        className="mt-1 accent-emerald-400 cursor-pointer flex-shrink-0"
      />
      {editingTaskId === t._id ? (
        <div className="flex-1 flex items-center gap-2">
          <input
            autoFocus
            value={editingTaskTitle}
            onChange={(e) => setEditingTaskTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSaveTask(t._id)}
            className="flex-1 text-sm bg-white border border-gray-300 px-2 py-1 rounded outline-none text-text-dark focus:border-blue-500"
          />
          <button onClick={() => handleSaveTask(t._id)} className="text-emerald-500 hover:text-emerald-600 p-1"><CheckCircle2 size={16} /></button>
          <button onClick={() => { setEditingTaskId(null); setEditingTaskTitle(""); }} className="text-red-500 hover:text-red-600 p-1 font-semibold">✕</button>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-start gap-1">
          <span className={`text-sm break-words ${t.completed ? 'line-through text-gray-400' : 'text-text-dark'}`}>{t.title}</span>
          {t.priority_label && (
            <span className={`text-[9px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-md ${t.priority_label === 'High' ? 'bg-red-100 text-red-600' : t.priority_label === 'Medium' ? 'bg-orange-100 text-orange-600' : 'bg-green-100 text-green-600'}`}>
              {t.priority_label} Priority
            </span>
          )}
        </div>
      )}

      {editingTaskId !== t._id && (
        <div className="hidden group-hover:flex items-center gap-1 flex-shrink-0">
          <button onClick={() => { setEditingTaskId(t._id || null); setEditingTaskTitle(t.title); }} className="text-gray-400 hover:text-blue-500 p-1"><Edit2 size={14} /></button>
          <button onClick={() => handleDeleteTask(t._id)} className="text-gray-400 hover:text-red-500 p-1"><Trash2 size={14} /></button>
        </div>
      )}
    </div>
  )

  // Generate the next 7 days for the timetable columns
  const getNext7Days = () => {
    const arr = [];
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const isoDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const shortDay = d.toLocaleDateString("en-US", { weekday: 'short' });
      const label = `${shortDay} • ${d.toLocaleDateString("en-US", { month: 'short', day: 'numeric' })}`;
      arr.push({ date: isoDate, label });
    }
    return arr;
  };

  const scheduleDays = getNext7Days();

  // Helper to place generated schedule items & calendar events into dates
  const getTasksForDate = (dateStr: string) => {
    const formatTime = (timeStr: string) => {
      if (!timeStr) return "00:00 AM";
      if (timeStr.includes("T")) {
        const d = new Date(timeStr);
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
      }
      return timeStr; // fallback
    };

    const formattedCalendarEvents = calendarEvents.map(e => {
      let isoDate = e.date;
      if (!isoDate && e.start_time) {
        if (e.start_time.includes("T")) {
          isoDate = e.start_time.split("T")[0];
        }
      }
      return {
        title: e.title,
        start_time: formatTime(e.start_time),
        end_time: formatTime(e.end_time),
        category: "calendar",
        source: e.source || "google",
        date: isoDate,
        date_label: ''
      };
    }).filter(e => e.date === dateStr);

    const generatedForDay = generatedSchedule.filter(t => t.date === dateStr).map(t => ({
      ...t,
      start_time: t.start_time || "00:00",
      source: t.type === "google_calendar" ? "google" : (t.type === "auto_scheduled" || t.source === "gyau" ? "gyau" : "imported")
    }));

    return [...generatedForDay, ...formattedCalendarEvents].sort((a, b) => (a.start_time || "00:00").localeCompare(b.start_time || "00:00"));
  };

  const calculateTotalFocus = () => {
    const totalMins = generatedSchedule.filter(t => t.category === "Study" || t.category === "Big" || t.category === "Small").reduce((acc, t) => acc + t.duration, 0);
    const hrs = Math.floor(totalMins / 60);
    const mins = totalMins % 60;
    return `${hrs}h ${mins}m`;
  };

  const getDayAtGlanceStats = () => {
    let classes = 0, study = 0, breaks = 0, others = 0;
    generatedSchedule.forEach(t => {
      if (t.category === "Class") classes++;
      else if (t.category === "Study") study++;
      else if (t.category === "Break") breaks++;
      else others++;
    });
    return { classes, study, breaks, others };
  };

  const stats = getDayAtGlanceStats();

  const getBlockColor = (category: string, source?: string) => {
    if (source === "google") return "bg-blue-100 text-blue-900 border-blue-200";
    if (source === "imported") return "bg-purple-100 text-purple-900 border-purple-200";
    if (source === "gyau") return "bg-emerald-100 text-emerald-900 border-emerald-200";

    switch (category) {
      case "Class": return "bg-[#dbc9ea] text-purple-900 border-[#c4aee0]";
      case "Personal": return "bg-[#fabbe8] text-pink-900 border-[#e89cd3]";
      case "Study": return "bg-[#ecf0d0] text-lime-900 border-[#dae0b4]";
      case "Break": return "bg-[#f7dda4] text-yellow-900 border-[#e8ca88]";
      case "calendar": return "bg-blue-100 text-blue-900 border-blue-200";
      default: return "bg-white text-gray-800 border-gray-200";
    }
  }

  const extendedInsights = [...plannerInsights];
  if (stats.breaks === 0 && generatedSchedule.length > 0) {
    extendedInsights.unshift("Warning: No breaks scheduled! Remember to rest and hydrate. 💧");
  }
  if (stats.classes > 3) {
    extendedInsights.unshift("Heads up: Back-to-back classes detected today. Stay energized! ⚡");
  }

  const taskBoardContent = (
    <div className="flex flex-col gap-6 w-full max-w-[1600px] mx-auto pt-2 overflow-x-hidden">

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* LEFT COLUMN: Timetable + Gayu Plan */}
        <div className="col-span-1 lg:col-span-9 flex flex-col gap-6">

          <div className="flex flex-col md:flex-row justify-between items-start md:items-center px-2 gap-4">
            <h2 className="text-3xl font-bold text-text-dark tracking-tight">Weekly Timetable</h2>
          </div>

          <div className="bg-white/70 backdrop-blur-md rounded-3xl p-6 border border-white card-base">
            {generatedSchedule.length === 0 && calendarEvents.length === 0 ? (
              <div className="text-center text-gray-400 py-16 bg-white/40 rounded-2xl border border-dashed border-gray-200">
                <p>No schedule generated yet.</p>
                <p className="text-sm">Upload a timetable or add tasks to begin.</p>
              </div>
            ) : (
              <div className="grid gap-3 pb-4 custom-scrollbar w-full h-[320px] overflow-auto max-w-full" style={{ gridTemplateColumns: "repeat(7, minmax(140px, 1fr))" }}>
                {scheduleDays.map(dayObj => (
                  <div key={dayObj.date} className="flex flex-col gap-2">
                    <div className="text-center font-bold text-sm text-gray-500 bg-white/60 py-2 rounded-xl border border-gray-100">{dayObj.label}</div>
                    <div className="flex flex-col gap-1.5">
                      {getTasksForDate(dayObj.date).map((t, idx) => (
                        <div key={idx} className={`p-1 rounded-[16px] border shadow-sm flex flex-col gap-0.5 ${getBlockColor(t.category, (t as any).source)} min-h-[60px] break-words whitespace-normal`}>
                          {(t as any).date_label && (
                            <span className="font-bold opacity-80 text-[10px] tracking-wide leading-[1.2] mt-0.5">{(t as any).date_label}</span>
                          )}
                          <span className="font-semibold opacity-70 text-[10px] tracking-wider uppercase leading-[1.3] mt-0.5">{t.start_time} - {t.end_time}</span>
                          <span className="font-bold text-[12px] leading-[1.3] line-clamp-3 text-ellipsis">{t.title}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* GAYU PLAN (Moved to Left Column) */}
          <div className="w-full bg-white/70 backdrop-blur-md rounded-3xl p-8 border border-white card-shadow mt-2 mb-12">
            <div className="mb-6">
              <h3 className="font-bold text-2xl text-text-dark">Gayu's Plan For You ✨</h3>
              <p className="text-gray-500">AI-crafted suggestions based on your timetable</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {extendedInsights.length === 0 ? (
                <div className="col-span-3 w-full bg-white/40 rounded-2xl p-10 text-center text-gray-400 text-base border border-dashed border-gray-200 h-[250px] flex items-center justify-center">
                  Waiting for insights...
                </div>
              ) : (
                extendedInsights.slice(0, 3).map((insight, idx) => {
                  const colors = ["bg-[#dbc9ea]", "bg-[#ecf0d0]", "bg-[#fabbe8]"];
                  let mascot = gayu1;
                  if (insight.toLowerCase().includes("break") || insight.toLowerCase().includes("rest")) {
                    mascot = gayu3;
                  } else if (insight.toLowerCase().includes("study") || insight.toLowerCase().includes("class")) {
                    mascot = gayu2;
                  }

                  const color = colors[idx % colors.length];

                  return (
                    <div key={idx} className={`h-[250px] ${color} p-7 rounded-[30px] border border-white/50 shadow-sm flex flex-col justify-between transition-colors relative flex-none`}>
                      <p className="text-base font-semibold text-gray-800 leading-relaxed pr-24 relative z-10">{insight}</p>
                      <img src={mascot} alt="Gayu" className="h-[110px] w-auto object-contain drop-shadow-md absolute bottom-2 right-2 z-0" />
                    </div>
                  )
                })
              )}
            </div>
          </div>

        </div>

        {/* RIGHT SIDEBAR: Day at a Glance + Manage Imports */}
        <div className="col-span-1 lg:col-span-3 flex flex-col gap-6 pt-2">

          <AnimatedButton as="label" className="w-full">
            <FileUp size={18} /> Upload Timetable
            <input type="file" accept="image/*,.csv,.xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" className="hidden" onChange={handleUploadAndGenerate} />
          </AnimatedButton>

          <AnimatedButton onClick={() => setIsManageImportsOpen(true)} className="w-full">
            <Database size={18} /> Manage Imports
          </AnimatedButton>

          <AnimatedButton onClick={() => handleCalendarSync()} className="w-full bg-[#dbc9ea] hover:bg-[#c9b3db] text-purple-900 shadow-[0_0_15px_rgba(219,201,234,0.4)]">
            <Calendar size={18} /> Sync Google Calendar
          </AnimatedButton>

          <AnimatedButton onClick={() => handleAutoSchedule()} className="w-full bg-[#d9efec] hover:bg-[#c1e8e2] text-teal-900 shadow-[0_0_15px_rgba(217,239,236,0.4)]">
            <Sparkles size={18} /> Auto-Schedule Tasks
          </AnimatedButton>

          <div className="bg-white/70 backdrop-blur-md rounded-3xl p-6 border border-white card-shadow">
            <h3 className="font-semibold text-lg text-text-dark mb-5 flex items-center gap-2"><PieChart size={18} className="text-emerald-500" /> Day at a Glance</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center text-sm p-3 bg-white/60 rounded-2xl">
                <span className="text-gray-600 font-semibold">Total Focus Time</span>
                <span className="font-bold text-emerald-700 bg-[#d9efec] px-3 py-1 rounded-xl shadow-sm">{calculateTotalFocus()}</span>
              </div>
              <div className="flex justify-between items-center text-sm p-3 bg-white/60 rounded-2xl">
                <span className="text-gray-600 font-semibold">Classes</span>
                <span className="font-bold text-purple-700 bg-[#dbc9ea] px-3 py-1 rounded-xl shadow-sm">{stats.classes} blocks</span>
              </div>
              <div className="flex justify-between items-center text-sm p-3 bg-white/60 rounded-2xl">
                <span className="text-gray-600 font-semibold">Study Sessions</span>
                <span className="font-bold text-lime-800 bg-[#ecf0d0] px-3 py-1 rounded-xl shadow-sm">{stats.study} blocks</span>
              </div>
              <div className="flex justify-between items-center text-sm p-3 bg-white/60 rounded-2xl">
                <span className="text-gray-600 font-semibold">Breaks</span>
                <span className="font-bold text-yellow-800 bg-[#f7dda4] px-3 py-1 rounded-xl shadow-sm">{stats.breaks} blocks</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen p-4 md:p-8 flex flex-col items-center bg-transparent relative">
      <Toaster position="top-right" />
      {/* Simulated OAuth Modal */}
      {isSimulatedLoginOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full card-shadow flex flex-col items-center text-center">
            <h2 className="text-xl font-semibold text-text-dark mb-2">Sign in with Google</h2>
            <p className="text-sm text-text-light mb-6">GYAU wants to access your Calendar and Gmail to help you focus.</p>
            <button
              onClick={handleSimulatedLogin}
              className="w-full bg-blue-600 text-white font-semibold py-3 rounded-xl hover:bg-blue-700 transition-colors"
            >
              Allow Access (Demo Mode)
            </button>
            <button
              onClick={() => setIsSimulatedLoginOpen(false)}
              className="w-full text-gray-500 font-medium py-3 mt-2 hover:bg-gray-50 rounded-xl transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {isAIHelpersModalOpen && (
        <AIHelpersModal
          onClose={() => setIsAIHelpersModalOpen(false)}
          onSelectHelper={(helper) => {
            setIsAIHelpersModalOpen(false);
            if (helper === 'PlanDay') setIsPlanDayOpen(true);
            else if (helper === 'BreakTask') setIsBreakTaskOpen(true);
            else if (helper === 'RevisionPlan') setIsRevisionPlanOpen(true);
            else if (helper === 'Study') {
              setTalkMode('study');
              setIsTalkDrawerOpen(true);
            }
            else if (helper === 'Prioritize') {
              handlePrioritize();
            }
          }}
        />
      )}

      {isPlanDayOpen && (
        <PlanDayModal
          onClose={() => setIsPlanDayOpen(false)}
          onSubmit={handlePlanDay}
          isLoading={planDayLoading}
        />
      )}

      {isBreakTaskOpen && (
        <BreakTaskModal
          onClose={() => { setIsBreakTaskOpen(false); setGeneratedSubtasks(null); }}
          onSubmit={handleBreakTask}
          onAcceptSubtasks={handleAcceptSubtasks}
          isLoading={breakTaskLoading}
          generatedSubtasks={generatedSubtasks}
        />
      )}

      {isRevisionPlanOpen && (
        <RevisionPlanModal
          onClose={() => setIsRevisionPlanOpen(false)}
          onSubmit={handleRevisionPlan}
          isLoading={revisionPlanLoading}
        />
      )}

      {isAddTaskOpen && (
        <AddTaskModal
          initialTitle={taskInput}
          onClose={() => setIsAddTaskOpen(false)}
          onSubmit={handleAdvancedAddTask}
        />
      )}

      {/* Manage Imports Modal */}
      {isManageImportsOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full card-shadow flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-text-dark flex items-center gap-2"><Database size={20} /> Manage Imports</h2>
              <button onClick={() => setIsManageImportsOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>

            <div className="space-y-4 max-h-[60vh] overflow-y-auto custom-scrollbar pr-2">
              {plannerMemory.length === 0 ? (
                <p className="text-center text-gray-400 text-sm py-8">No files imported yet.</p>
              ) : (
                plannerMemory.map((imp) => (
                  <div key={imp.import_id} className={`flex items-center justify-between p-4 rounded-xl border ${imp.active ? 'bg-emerald-50/50 border-emerald-100' : 'bg-gray-50 border-gray-100 opacity-60'} transition-all`}>
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className={`p-2 rounded-lg ${imp.active ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-200 text-gray-500'}`}>
                        {imp.source_type === 'image' ? <ImageUp size={16} /> : <FileUp size={16} />}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-sm font-semibold text-text-dark truncate">{imp.file_name}</span>
                        <span className="text-xs text-gray-500">{new Date(imp.upload_timestamp).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleToggleImport(imp.import_id)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${imp.active ? 'bg-emerald-200 text-emerald-800 hover:bg-emerald-300' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>
                        {imp.active ? 'Active' : 'Inactive'}
                      </button>
                      <button onClick={() => handleDeleteImport(imp.import_id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-gray-100 flex justify-end">
              <button onClick={() => setIsManageImportsOpen(false)} className="bg-gray-100 text-gray-600 font-semibold px-6 py-2.5 rounded-xl hover:bg-gray-200 transition-colors">Done</button>
            </div>
          </div>
        </div>
      )}
      {/* Top Navigation Bar */}
      <nav className="w-full max-w-7xl flex items-center justify-between bg-[#d9efec]/75 backdrop-blur-xl rounded-[28px] p-4 px-8 mb-8 border border-white/50 shadow-[0_10px_35px_rgba(0,0,0,0.03)] sticky top-4 z-40">
        <h1 className="flex items-center gap-2 text-[#1c1f1c]" style={{ fontFamily: "'Press Start 2P', cursive", fontSize: "22px", letterSpacing: "-1px" }}>
          GYAU <img src={cupIcon} alt="cup" className="w-8 h-8 object-contain" />
        </h1>
        <div className="flex gap-2 items-center">
          <button
            onClick={() => { console.log("[CLICK] Tab: Home"); setActiveTab('Home'); }}
            className={`px-5 py-2 rounded-xl transition-colors font-semibold ${activeTab === 'Home' ? 'bg-bg2 text-emerald-700 shadow-sm' : 'text-text-dark hover:bg-gray-50'}`}
          >
            Home
          </button>
          <button
            onClick={() => { console.log("[CLICK] Tab: My Day"); setActiveTab('My Day'); }}
            className={`px-5 py-2 rounded-xl transition-colors font-semibold ${activeTab === 'My Day' ? 'bg-bg2 text-emerald-700 shadow-sm' : 'text-text-dark hover:bg-gray-50'}`}
          >
            My Day
          </button>
          <button
            onClick={() => { console.log("[CLICK] Tab: Insights"); setActiveTab('Insights'); }}
            className={`px-5 py-2 rounded-xl transition-colors font-semibold ${activeTab === 'Insights' ? 'bg-bg2 text-emerald-700 shadow-sm' : 'text-text-dark hover:bg-gray-50'}`}
          >
            Insights
          </button>
          {isGuest && (
            <button
              onClick={() => navigate('/login')}
              className="ml-2 px-4 py-2 bg-emerald-600 text-white rounded-xl font-semibold shadow-sm hover:bg-emerald-700 transition-colors"
            >
              Log in to Save
            </button>
          )}
          <ProfileMenu />
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="w-full max-w-7xl flex-1 flex flex-col">
        {/* Header */}
        <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            {activeTab === 'My Day' ? (
              <>
                <h2 className="text-4xl font-semibold text-text-dark mb-2">My Day Planner 🌸</h2>
                <p className="text-text-light text-md max-w-2xl font-medium">Plan your day smartly!</p>
              </>
            ) : activeTab === 'Insights' ? (
              <>
                <h2 className="text-4xl font-semibold text-text-dark mb-2">Check your Insights ✨</h2>
                <p className="text-text-light text-md max-w-2xl font-medium italic">"If you have built castles in the air, your work need not be lost; that is where they should be. Now put the foundations under them"</p>
              </>
            ) : (
              <>
                <h2 className="text-4xl font-semibold text-text-dark mb-2">Welcome back, idiot. 🌸</h2>
                <p className="text-text-light text-md max-w-2xl font-medium">{gayuMessage}</p>
              </>
            )}
          </div>
          <div className="flex gap-2">
            <AnimatedButton onClick={toggleFocusMode}>
              <CheckCircle2 size={16} className={focusMode ? 'text-emerald-600' : 'text-emerald-500'} /> {focusMode ? 'Focus Active' : 'Focus Mode'}
            </AnimatedButton>
            <AnimatedButton onClick={() => setIsTalkDrawerOpen(true)}>
              <Sparkles size={16} className="text-pink-500" /> Talk to Gayu
            </AnimatedButton>
          </div>
        </header>

        {/* Main View switching based on activeTab */}
        {activeTab === 'Insights' ? (
          <div className="space-y-6">
            <h3 className="font-semibold text-3xl text-text-dark mb-6 flex items-center gap-3">
              Insights & Analytics <Activity className="text-emerald-500" />
            </h3>

            {/* Row 1: Focus Overview and Streak */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Focus App Usage Overview */}
              <div className="bg-white rounded-3xl p-8 border border-[#ecf0d0] card-shadow">
                <h3 className="font-semibold text-text-dark mb-4 flex items-center gap-2 justify-between">
                  <span>Focus Overview</span>
                  <span className="text-gray-400 text-xs">ⓘ Screen Time</span>
                </h3>
                <div className="flex items-center gap-8">
                  <div className="w-32 h-32 rounded-full border-[12px] border-t-red-400 border-r-blue-400 border-b-yellow-400 border-l-emerald-300 flex items-center justify-center relative shadow-inner">
                    <div className="text-center">
                      <p className="font-extrabold text-lg text-text-dark">{formatTime(Number(Object.values(analyticsChart?.app_usage || {}).reduce((a: any, b: any) => a + b, 0)))}</p>
                      <p className="text-xs text-text-light">Total</p>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm flex-1">
                    <div className="flex justify-between items-center">
                      <span className="flex items-center gap-2"><div className="w-2.5 h-2.5 bg-red-400 rounded-full"></div>YouTube</span>
                      <span className="text-text-light font-medium">{formatTime(analyticsChart?.app_usage?.YouTube || 0)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="flex items-center gap-2"><div className="w-2.5 h-2.5 bg-blue-400 rounded-full"></div>Instagram</span>
                      <span className="text-text-light font-medium">{formatTime(analyticsChart?.app_usage?.Instagram || 0)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="flex items-center gap-2"><div className="w-2.5 h-2.5 bg-yellow-400 rounded-full"></div>LinkedIn</span>
                      <span className="text-text-light font-medium">{formatTime(analyticsChart?.app_usage?.LinkedIn || 0)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Distraction Profile Radar Chart */}
              <div className="bg-white rounded-3xl p-8 border border-[#ecf0d0] card-shadow relative overflow-hidden">
                <h3 className="font-semibold flex items-center gap-2 mb-2 text-text-dark">Distraction Profile 🎯</h3>
                <p className="text-sm text-text-light mb-4 font-medium">Your current AI insights mapped out.</p>

                <div className="w-full h-[250px] -ml-4">
                  {radarData && radarData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                        <PolarGrid stroke="#ecf0d0" />
                        <PolarAngleAxis dataKey="subject" tick={{ fill: '#737373', fontSize: 10 }} />
                        <PolarRadiusAxis angle={30} domain={[0, 150]} tick={false} axisLine={false} />
                        <Radar name="Distractions" dataKey="A" stroke="#34d399" fill="#34d399" fillOpacity={0.4} />
                        <Tooltip />
                      </RadarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-400 text-sm">Loading profile...</div>
                  )}
                </div>
              </div>
            </div>

            {/* Row 2: Integrations */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Sync Calendar */}
              <div className="bg-white rounded-3xl p-8 border border-[#ecf0d0] card-shadow flex flex-col justify-center items-center text-center col-span-1">
                {calendarEvents.length > 0 ? (
                  <div className="w-full text-left space-y-2">
                    <h4 className="font-semibold text-sm text-text-dark flex items-center gap-2 mb-2">
                      📅 Synced Meetings ({calendarEvents.length})
                    </h4>
                    {calendarEvents.map((evt, idx) => (
                      <div key={idx} className="bg-blue-50/50 p-2 rounded-xl border border-blue-100/50 flex justify-between text-xs">
                        <span className="font-semibold text-blue-900 truncate max-w-[140px]">{evt.title}</span>
                        <span className="text-blue-700 whitespace-nowrap">{new Date(evt.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    ))}
                    <button
                      onClick={handleGoogleAuthClick}
                      className="w-full mt-2 bg-bg2 text-emerald-800 py-2 rounded-xl text-xs font-semibold hover:bg-emerald-100 transition-colors"
                    >
                      Resync Connections
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center text-xl font-semibold mb-3 shadow-sm border border-blue-100">
                      <Calendar size={24} />
                    </div>
                    <h3 className="font-semibold text-text-dark mb-2">Connect Google</h3>
                    <p className="text-sm text-text-light mb-4 px-2">Sync Calendar and Gmail automatically.</p>
                    <button
                      onClick={handleGoogleAuthClick}
                      className="w-full bg-accent-primary text-white py-3 rounded-2xl font-semibold hover:bg-emerald-500 transition-all flex justify-center items-center gap-2 shadow-sm"
                    >
                      <RefreshCw size={18} /> Connect Account
                    </button>
                  </>
                )}
              </div>

              {/* Gmail Unread */}
              {gmailData && (
                <div className="bg-blue-50/50 rounded-3xl p-8 border border-blue-100 col-span-1 card-shadow">
                  <h4 className="font-semibold text-blue-800 mb-4 text-xl flex items-center gap-2">
                    Gmail Unread <span className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full">{gmailData.unread_count}</span>
                  </h4>
                  <div className="space-y-3">
                    {gmailData.emails.map((email: any, idx: number) => (
                      <div key={idx} className="bg-white/80 p-3 rounded-xl shadow-sm flex flex-col gap-1 border border-blue-50">
                        <span className="font-semibold text-sm text-text-dark truncate">{email.subject}</span>
                        <span className="text-xs text-text-light truncate">{email.sender}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Payments */}
              {payments.length > 0 && (
                <div className="bg-purple-50/50 rounded-3xl p-8 border border-purple-100/60 card-shadow col-span-1">
                  <h4 className="font-semibold text-purple-900 text-sm mb-3 flex items-center gap-2">
                    <Clock size={16} /> Upcoming Payments
                    <span className="bg-purple-100 text-[9px] px-1.5 py-0.5 rounded text-purple-600 font-semibold ml-auto">Demo Mode</span>
                  </h4>
                  <div className="space-y-3">
                    {payments.map((p, idx) => (
                      <div key={idx} className="bg-white p-3 rounded-xl flex justify-between items-center shadow-xs border border-purple-50">
                        <div>
                          <p className="text-xs font-semibold text-text-dark">{p.merchant}</p>
                          <p className="text-[10px] text-text-light">Due {new Date(p.due_date).toLocaleDateString()}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-semibold text-purple-700">${p.amount}</p>
                          <button
                            onClick={async () => {
                              try {
                                const res = await apiFetch(`${API_BASE}/payments/approve?merchant=${p.merchant}`, { method: 'POST' })
                                if (res.ok) {
                                  const data = await res.json()
                                  setGayuMessage(data.message)
                                  fetchData()
                                }
                              } catch (e) { console.error(e) }
                            }}
                            className="bg-purple-100 hover:bg-purple-200 text-purple-800 text-[10px] px-2.5 py-1 rounded-lg font-semibold transition-colors mt-1"
                          >
                            Approve
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : activeTab === 'My Day' ? (
          <div className="w-full">
            {taskBoardContent}
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

              {/* Left / Center Column (Spans 8 cols on desktop) */}
              <div className="col-span-1 lg:col-span-8 space-y-6">

                {/* Mascot Banner matching persistent design */}
                <div className="rounded-[28px] border border-white card-base flex flex-col md:flex-row items-center justify-between px-10 py-6 relative overflow-hidden bg-white/60 backdrop-blur-xl h-[240px]">
                  {/* Layer 1 — Background clouds */}
                  <img
                    src={clouds1}
                    alt="clouds"
                    className="absolute top-0 left-0 w-full h-full object-cover opacity-10 z-[1] mix-blend-overlay pointer-events-none"
                  />

                  {/* Text Layer */}
                  <div className="flex flex-col justify-center z-[6] w-full max-w-[50%]">
                    <div className="bg-white/80 p-5 rounded-2xl shadow-sm border border-emerald-50 mb-2 relative">
                      <h3 className="text-xl font-bold text-text-dark mb-1">Hi, I'm Gayu!</h3>
                      <p className="text-sm text-gray-500 font-medium">
                        Don't get the wrong idea, I'm just here because I have to be. Now get to work!
                      </p>
                      <div className="absolute top-1/2 -right-3 w-3 h-3 bg-white/80 transform rotate-45 translate-x-1/2 -translate-y-1/2 border-t border-r border-emerald-50 hidden md:block"></div>
                    </div>
                    {isLoading && (
                      <p className="text-xs text-accent-pink animate-pulse mt-2 font-semibold">Gayu is thinking...</p>
                    )}
                  </div>

                  {/* Illustration Layer */}
                  <div className="z-[2] w-full max-w-[45%] h-full flex items-end justify-end">
                    <img
                      src={desk1}
                      alt="Desk"
                      className="w-full max-h-[320px] object-contain pointer-events-none"
                    />
                  </div>
                </div>

                {/* Input Bar (Claude-style Command Bar) */}
                <div className="bg-white rounded-2xl p-2 flex items-center gap-3 border border-[#ecf0d0] card-base relative z-30 pointer-events-auto shadow-lg">
                  <div className="relative">
                    <button
                      onClick={() => setIsPlusMenuOpen(!isPlusMenuOpen)}
                      className="p-2.5 rounded-xl hover:bg-gray-100 text-gray-500 transition-colors"
                    >
                      <Plus size={20} />
                    </button>
                    {isPlusMenuOpen && (
                      <div className="absolute top-full left-0 mt-2 w-56 bg-white border border-[#ecf0d0] rounded-2xl shadow-xl py-2 z-50">
                        <label className="w-full text-left px-4 py-2 text-sm font-semibold text-text-dark hover:bg-gray-50 flex items-center gap-2 cursor-pointer">
                          <FileUp size={16} className="text-gray-400" /> Upload Files
                          <input type="file" accept=".xlsx,.csv,.jpg,.jpeg,.png,.pdf" className="hidden" onChange={handleHomeUpload} />
                        </label>
                        <button onClick={() => { setIsPlusMenuOpen(false); setIsAIHelpersModalOpen(true); }} className="w-full text-left px-4 py-2 text-sm font-semibold text-text-dark hover:bg-gray-50 flex items-center gap-2"><Sparkles size={16} className="text-purple-400" /> AI Helpers</button>
                        <button onClick={() => { setIsPlusMenuOpen(false); setIsAddTaskOpen(true); }} className="w-full text-left px-4 py-2 text-sm font-semibold text-text-dark hover:bg-gray-50 flex items-center gap-2"><CheckCircle2 size={16} className="text-emerald-400" /> Manual Task</button>
                      </div>
                    )}
                  </div>
                  <input
                    ref={taskInputRef}
                    type="text"
                    placeholder="✨ What would you like to add?"
                    className="flex-1 bg-transparent border-none outline-none text-text-dark placeholder-gray-400 font-medium text-[15px]"
                    value={taskInput}
                    onChange={(e) => setTaskInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const text = taskInput.trim().toLowerCase()
                        if (text.match(/^(add|create|task|finish|do)\b/i) && text.length < 50 && !text.match(/\b(plan|schedule|timetable)\b/i)) {
                          handleAddTask()
                        } else if (text.match(/\b(plan|schedule|timetable)\b/i)) {
                          toast.success("Planning your day...");
                          triggerOrchestrate(true);
                          setTaskInput('')
                        } else if (text.match(/\b(summarize|pdf|help|explain|ai)\b/i)) {
                          setIsAIHelpersModalOpen(true);
                          setTaskInput('')
                        } else {
                          setIsTalkDrawerOpen(true)
                          setTalkModalTab('Text')
                          setTalkInputText(taskInput)
                          handleTalkSubmit(taskInput)
                          setTaskInput('')
                        }
                      }
                    }}
                  />
                  <button
                    onClick={() => {
                      const text = taskInput.trim().toLowerCase()
                      if (text.match(/^(add|create|task|finish|do)\b/i) && text.length < 50 && !text.match(/\b(plan|schedule|timetable)\b/i)) {
                        handleAddTask()
                      } else if (text.match(/\b(plan|schedule|timetable)\b/i)) {
                        toast.success("Planning your day...");
                        triggerOrchestrate(true);
                        setTaskInput('')
                      } else if (text.match(/\b(summarize|pdf|help|explain|ai)\b/i)) {
                        setIsAIHelpersModalOpen(true);
                        setTaskInput('')
                      } else {
                        setIsTalkDrawerOpen(true)
                        setTalkModalTab('Text')
                        setTalkInputText(taskInput)
                        handleTalkSubmit(taskInput)
                        setTaskInput('')
                      }
                    }}
                    className="bg-emerald-600 text-white border border-transparent px-4 py-2 rounded-xl font-semibold flex items-center gap-2 transition-all shadow-sm btn-glow-wrapper glow-mint"
                  >
                    Send
                  </button>
                </div>

              </div> {/* End of Left Column */}

              {/* Right Column (Spans 4 cols on desktop) */}
              <div className="col-span-1 lg:col-span-4 space-y-6">

                {/* AI Insight Card */}
                <div className="bg-white rounded-3xl p-8 border border-[#ecf0d0] card-shadow relative overflow-hidden">
                  <h3 className="font-semibold flex items-center gap-2 mb-4 text-text-dark">AI Insight ✨</h3>
                  <div className="bg-blue-50/80 w-12 h-12 rounded-2xl flex items-center justify-center text-2xl mb-4 shadow-sm border border-blue-100">
                    🤖
                  </div>
                  <p className="text-sm text-text-dark leading-relaxed mb-4">
                    {analyticsInsights?.ai_message || 'Keep working hard to get insights!'}
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setActiveTab('Insights')}
                      className="text-emerald-600 text-sm font-semibold flex items-center hover:text-emerald-700"
                    >
                      View Insights <ChevronRight size={16} />
                    </button>
                  </div>
                </div>

              </div> {/* End of Right Column */}

            </div> {/* End of Grid */}

            {/* Upcoming Tasks (Full Width) */}
            <div className="bg-white/60 backdrop-blur-md rounded-3xl p-8 border border-[#ecf0d0] card-shadow">
              <h3 className="font-semibold text-lg text-text-dark mb-4">Upcoming Tasks</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[...tasks.big, ...tasks.small, ...tasks.personal].filter(t => !t.completed).slice(0, 3).map(renderTask)}
              </div>
            </div>

          </div>
        )}
      </main>

      {/* Talk To Gayu Drawer */}
      {isTalkDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/20 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            {/* Drawer Header */}
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-bg2/30">
              <div className="flex items-center gap-3">
                <img src={gayu3} alt="Gayu" className="w-10 h-10 object-contain rounded-full bg-white shadow-sm" />
                <h2 className="text-lg font-semibold text-text-dark">
                  {talkMode === 'study' ? 'Study with Gayu 📚' : 'Talk to Gayu'}
                </h2>
              </div>
              <button onClick={() => { setIsTalkDrawerOpen(false); setTalkMode('normal'); stopRecording(); }} className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors">
                <X size={20} />
              </button>
            </div>

            {/* Chat History */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar bg-gray-50/50">
              {chatHistory.length === 0 ? (
                <div className="text-center text-gray-400 text-sm py-8 font-medium">No messages yet. Ask me something!</div>
              ) : (
                chatHistory.map((msg, idx) => (
                  <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                    <div className={`px-4 py-3 rounded-2xl max-w-[85%] text-sm font-medium shadow-sm ${msg.role === 'user' ? 'bg-emerald-600 text-white rounded-tr-none' : 'bg-white text-text-dark border border-gray-100 rounded-tl-none'}`}>
                      {msg.text}
                    </div>
                  </div>
                ))
              )}
              {isLoading && (
                <div className="flex items-start">
                  <div className="px-4 py-3 rounded-2xl bg-white border border-gray-100 rounded-tl-none shadow-sm text-sm text-gray-400 italic">
                    Gayu is typing...
                  </div>
                </div>
              )}
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white border-t border-gray-100">
              <div className="flex gap-2 bg-gray-100 p-1 rounded-xl mb-3 w-full">
                <button
                  onClick={() => setTalkModalTab('Text')}
                  className={`flex-1 py-1 text-xs font-semibold rounded-lg transition-colors ${talkModalTab === 'Text' ? 'bg-white shadow text-emerald-600' : 'text-gray-500 hover:text-gray-700'}`}
                >Text</button>
                <button
                  onClick={() => setTalkModalTab('Voice')}
                  className={`flex-1 py-1 text-xs font-semibold rounded-lg transition-colors ${talkModalTab === 'Voice' ? 'bg-white shadow text-emerald-600' : 'text-gray-500 hover:text-gray-700'}`}
                >Voice</button>
              </div>

              {talkModalTab === 'Text' ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-emerald-500 transition-colors"
                    placeholder="Type a message..."
                    value={talkInputText}
                    onChange={(e) => setTalkInputText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && talkInputText.trim()) {
                        handleTalkSubmit(talkInputText)
                        setTalkInputText('')
                      }
                    }}
                  />
                  <button onClick={() => {
                    if (talkInputText.trim()) {
                      handleTalkSubmit(talkInputText)
                      setTalkInputText('')
                    }
                  }} className="bg-emerald-600 text-white p-2.5 rounded-xl hover:bg-emerald-700 transition-colors shadow-sm">
                    <Sparkles size={18} />
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-center py-2">
                  {isRecording ? (
                    <div className="flex items-center gap-4 w-full">
                      <div className="flex-1 flex items-center justify-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse"></div>
                        <span className="text-xs font-semibold text-red-500">Recording...</span>
                      </div>
                      <button onClick={stopRecording} className="bg-gray-800 text-white text-xs font-semibold py-2 px-4 rounded-xl hover:bg-gray-700 transition-colors">
                        Stop & Transcribe
                      </button>
                    </div>
                  ) : (
                    <button onClick={startRecording} className="flex items-center justify-center gap-2 w-full bg-emerald-50 text-emerald-600 border border-emerald-100 py-2.5 rounded-xl hover:bg-emerald-100 transition-colors">
                      <Mic size={18} /> <span className="text-sm font-semibold">Tap to Record</span>
                    </button>
                  )}
                </div>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  )
}

function App() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/" /> : <Login />}
      />

      <Route
        path="/signup"
        element={isAuthenticated ? <Navigate to="/" /> : <Signup />}
      />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default App
