// import React, { useState, useEffect, useCallback } from 'react';
// import DashboardLayout from '../layouts/DashboardLayout';
// import { healthService } from '../services/healthService';
// import { useAuth } from '../context/AuthContext';
// import MetricCard from '../features/dashboard/MetricCard';
// import MealSection from '../features/dashboard/MealSection';
// import WorkoutSection from '../features/dashboard/WorkoutSection';
// import GoalSummary from '../features/dashboard/GoalSummary';
// import SkeletonCard from '../components/ui/SkeletonCard';
// import Button from '../components/ui/Button';
// import Card from '../components/ui/Card';
// import GoalModal from '../components/ui/GoalModal';
// import CancelGoalModal from '../components/ui/CancelGoalModal';
// import NotificationOverlay from '../components/ui/NotificationOverlay';
// import { motion } from 'framer-motion';
// import { staggerContainer, staggerItem } from '../animations/variants';
// import {
//   IoFlameOutline,
//   IoHeartOutline,
//   IoWaterOutline,
//   IoBedOutline,
//   IoChatbubbleEllipsesOutline,
//   IoCalendarOutline,
//   IoBarChartOutline,
//   IoFlagOutline,
//   IoTodayOutline,
//   IoCameraOutline,
//   IoLockClosedOutline,
//   IoArrowForward,
//   IoFitnessOutline,
// } from 'react-icons/io5';
// import toast from 'react-hot-toast';

// export default function Dashboard() {
//   const { updateGoalStatus } = useAuth();
//   const [loading, setLoading] = useState(true);
//   const [plan, setPlan] = useState(null);
//   const [goal, setGoal] = useState(null);
//   const [goalModalOpen, setGoalModalOpen] = useState(false);
//   const [cancelModalOpen, setCancelModalOpen] = useState(false);
//   const [autoPrompted, setAutoPrompted] = useState(false);
//   const [refreshKey, setRefreshKey] = useState(0);

//   const fetchDashboardData = useCallback(async () => {
//     try {
//       setLoading(true);
//       let activeGoal = null;

//       try {
//         const goalRes = await healthService.getActiveGoal();
//         if (goalRes.success && goalRes.data) {
//           activeGoal = goalRes.data;
//         }
//       } catch (error) {
//         if (error.response?.status !== 404) {
//           throw error;
//         }
//       }

//       setGoal(activeGoal);
//       updateGoalStatus(!!activeGoal);

//       if (activeGoal) {
//         const planRes = await healthService.getTodayPlan();
//         if (planRes.success) {
//           setPlan(planRes.data);
//         } else {
//           setPlan(null);
//         }
//       } else {
//         setPlan(null);
//       }
//     } catch (error) {
//       console.error(error);
//       toast.error('Failed to load dashboard data');
//     } finally {
//       setLoading(false);
//     }
//   }, [updateGoalStatus]);

//   useEffect(() => {
//     fetchDashboardData();
//   }, [fetchDashboardData]);

//   useEffect(() => {
//     if (!loading && !goal && !autoPrompted) {
//       setGoalModalOpen(true);
//       setAutoPrompted(true);
//     }
//   }, [loading, goal, autoPrompted]);

//   const handleGoalSuccess = async () => {
//     updateGoalStatus(true);
//     setRefreshKey((k) => k + 1);
//     await fetchDashboardData();
//   };

//   const handleCancelSuccess = async () => {
//     updateGoalStatus(false);
//     setPlan(null);
//     setGoal(null);
//     setRefreshKey((k) => k + 1);
//     await fetchDashboardData();
//   };

//   // `disabled` = genuinely not built yet ("Coming soon").
//   // `locked`   = already built, just gated behind having an active goal —
//   //              clicking it opens the goal form instead of doing nothing.
//   const hubOptions = [
//     {
//       id: 'set-goal',
//       title: 'Set Health Goal',
//       description: 'Enter biometrics and preferences to generate your personalized daily plan.',
//       icon: <IoFlagOutline size={28} className="text-brand" />,
//       action: () => setGoalModalOpen(true),
//       primary: true,
//     },
//     {
//       id: 'today-plan',
//       title: "Today's Plan",
//       description: 'Set a goal to unlock meals, workouts, sleep, and hydration tailored to you.',
//       icon: <IoTodayOutline size={28} className="text-water" />,
//       locked: true,
//       action: () => setGoalModalOpen(true),
//     },
//     {
//       id: 'food-scan',
//       title: 'Food Image Analysis',
//       description: 'Upload a meal photo for AI macro estimates. (Coming soon)',
//       icon: <IoCameraOutline size={28} className="text-calories" />,
//       disabled: true,
//     },
//     {
//       id: 'ai-chat',
//       title: 'AI Health Chat',
//       description: 'Ask questions about calories, food swaps, and wellness tips.',
//       icon: <IoChatbubbleEllipsesOutline size={28} className="text-brand" />,
//       disabled: true,
//     },
//     {
//       id: 'progress',
//       title: 'Progress & History',
//       description: 'Track weight logs, trends, and weekly reports.',
//       icon: <IoBarChartOutline size={28} className="text-water" />,
//       disabled: true,
//     },
//     {
//       id: 'calendar',
//       title: 'Weekly Schedule',
//       description: 'Plan workouts and meal prep across the week.',
//       icon: <IoCalendarOutline size={28} className="text-sleep" />,
//       disabled: true,
//     },
//   ];

//   if (loading) {
//     return (
//       <DashboardLayout>
//         <div className="space-y-6">
//           <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
//             <SkeletonCard rows={2} />
//             <SkeletonCard rows={2} />
//             <SkeletonCard rows={2} />
//             <SkeletonCard rows={2} />
//           </div>
//           <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
//             <div className="space-y-6 lg:col-span-2">
//               <SkeletonCard rows={4} />
//               <SkeletonCard rows={4} />
//             </div>
//             <SkeletonCard rows={3} />
//           </div>
//         </div>
//       </DashboardLayout>
//     );
//   }

//   const showPlan = Boolean(goal && plan);

//   return (
//     <DashboardLayout>
//       <NotificationOverlay refreshTrigger={refreshKey} />

//       <GoalModal
//         isOpen={goalModalOpen}
//         onClose={() => setGoalModalOpen(false)}
//         onSuccess={handleGoalSuccess}
//       />

//       <CancelGoalModal
//         isOpen={cancelModalOpen}
//         onClose={() => setCancelModalOpen(false)}
//         onSuccess={handleCancelSuccess}
//       />

//       {!showPlan ? (
//         <motion.div
//           className="space-y-8"
//           variants={staggerContainer}
//           initial="initial"
//           animate="animate"
//         >
//           {/* No-goal CTA banner — replaces the plain intro text with an
//               actual call to action, since this is the state every new
//               user lands on. */}
//           <motion.div
//             variants={staggerItem}
//             className="relative overflow-hidden rounded-2xl border border-brand/30 bg-gradient-to-br from-brand/15 via-surface to-surface p-6 sm:p-8"
//           >
//             <IoFitnessOutline
//               className="pointer-events-none absolute -right-8 -top-8 text-brand/10"
//               size={180}
//               aria-hidden="true"
//             />
//             <div className="relative z-10 max-w-xl">
//               <span className="inline-flex items-center gap-1.5 rounded-full bg-brand/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-brand">
//                 <IoFlagOutline size={14} />
//                 No active goal yet
//               </span>
//               <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-fg sm:text-4xl">
//                 Let&apos;s set up your health goal
//               </h1>
//               <p className="mt-2 text-fg-muted">
//                 Tell us a bit about yourself and we&apos;ll build a personalized daily
//                 plan — meals, workouts, sleep, and hydration — tailored just for you.
//               </p>
//               <motion.div
//                 className="mt-5 inline-block"
//                 whileHover={{ scale: 1.03 }}
//                 whileTap={{ scale: 0.97 }}
//               >
//                 <Button
//                   size="md"
//                   icon={<IoArrowForward />}
//                   iconPosition="right"
//                   onClick={() => setGoalModalOpen(true)}
//                 >
//                   Create My Goal
//                 </Button>
//               </motion.div>
//             </div>
//           </motion.div>

//           <motion.div variants={staggerItem}>
//             <h2 className="text-sm font-semibold uppercase tracking-wide text-fg-subtle">
//               Explore
//             </h2>
//           </motion.div>

//           <motion.div
//             variants={staggerItem}
//             className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
//           >
//             {hubOptions.map((option) => (
//               <Card
//                 key={option.id}
//                 hoverable={!option.disabled}
//                 glow={option.primary}
//                 className={`flex h-full flex-col items-start gap-3 text-left ${
//                   option.disabled ? 'opacity-60' : ''
//                 } ${option.locked ? 'border-dashed' : ''}`}
//                 onClick={option.disabled ? undefined : option.action}
//               >
//                 <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-surface-muted">
//                   {option.icon}
//                 </div>
//                 <h3 className="text-lg font-bold text-fg">{option.title}</h3>
//                 <p className="flex-1 text-sm leading-relaxed text-fg-muted">{option.description}</p>
//                 {option.primary ? (
//                   <Button size="sm" onClick={() => setGoalModalOpen(true)}>
//                     Open Goal Form
//                   </Button>
//                 ) : option.locked ? (
//                   <span className="inline-flex items-center gap-1.5 rounded-full bg-brand/10 px-3 py-1 text-xs font-semibold text-brand">
//                     <IoLockClosedOutline size={12} />
//                     Set Goal to Unlock
//                   </span>
//                 ) : option.disabled ? (
//                   <span className="text-xs font-medium uppercase tracking-wide text-fg-subtle">
//                     Coming soon
//                   </span>
//                 ) : null}
//               </Card>
//             ))}
//           </motion.div>
//         </motion.div>
//       ) : (
//         <motion.div
//           className="space-y-6"
//           variants={staggerContainer}
//           initial="initial"
//           animate="animate"
//         >
//           <motion.div variants={staggerItem} className="mb-2">
//             <h1 className="bg-gradient-to-r from-brand to-emerald-300 bg-clip-text text-3xl font-extrabold tracking-tight text-transparent sm:text-4xl">
//               Today&apos;s Health Outlook
//             </h1>
//             <p className="mt-2 text-fg-muted">
//               Your tailored daily plan from Health AI — meals, workouts, sleep, and hydration.
//             </p>
//           </motion.div>

//           <motion.div
//             variants={staggerItem}
//             className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4"
//           >
//             <MetricCard
//               title="Daily Target"
//               value={`${plan.calories} kcal`}
//               subtitle="Target calorie intake"
//               icon={<IoFlameOutline />}
//               accentColor="#FF6B35"
//               bgColor="bg-orange-500/10"
//               textColor="text-orange-400"
//             />
//             <MetricCard
//               title="Body Mass Index"
//               value={plan.bmi}
//               subtitle={`BMR: ${plan.bmr} kcal`}
//               icon={<IoHeartOutline />}
//               accentColor="#FF4757"
//               bgColor="bg-red-500/10"
//               textColor="text-red-400"
//             />
//             <MetricCard
//               title="Water Target"
//               value={plan.water}
//               subtitle="Hydration recommendation"
//               icon={<IoWaterOutline />}
//               accentColor="#2ED573"
//               bgColor="bg-blue-500/10"
//               textColor="text-blue-400"
//             />
//             <MetricCard
//               title="Sleep Target"
//               value={plan.sleep?.duration || '8 Hours'}
//               subtitle={`Bedtime: ${plan.sleep?.bedtime || '10:30 PM'}`}
//               icon={<IoBedOutline />}
//               accentColor="#A29BFE"
//               bgColor="bg-purple-500/10"
//               textColor="text-purple-400"
//             />
//           </motion.div>

//           <motion.div
//             variants={staggerItem}
//             className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3"
//           >
//             <div className="space-y-6 lg:col-span-2">
//               <MealSection meals={plan.meals} />
//               <WorkoutSection workout={plan.workout} />
//             </div>

//             <div className="space-y-6">
//               <GoalSummary goalData={goal} onUpdateGoal={() => setGoalModalOpen(true)} />

//               <Card className="flex flex-col items-start gap-3" glow>
//                 <IoChatbubbleEllipsesOutline size={32} className="text-brand" />
//                 <h3 className="text-lg font-bold">AI Health Chat</h3>
//                 <p className="text-sm leading-relaxed text-fg-muted">
//                   Consult the model about calories, food options, or health tips. (Coming soon)
//                 </p>
//                 <Button size="sm" variant="secondary" disabled>
//                   Start Chat
//                 </Button>
//               </Card>

//               <Card className="flex flex-col items-start gap-3" glow>
//                 <IoCalendarOutline size={32} className="text-water" />
//                 <h3 className="text-lg font-bold">Progress & History</h3>
//                 <p className="text-sm leading-relaxed text-fg-muted">
//                   Record weight logs and view weekly reports. (Coming soon)
//                 </p>
//                 <Button size="sm" variant="secondary" disabled icon={<IoBarChartOutline />}>
//                   Reports
//                 </Button>
//               </Card>

//               <Button variant="outline" className="w-full border-danger text-danger hover:border-danger hover:text-danger" onClick={() => setCancelModalOpen(true)}>
//                 Deactivate current goal
//               </Button>
//             </div>
//           </motion.div>
//         </motion.div>
//       )}
//     </DashboardLayout>
//   );
// }



import React, { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import { healthService } from '../services/healthService';
import { useAuth } from '../context/AuthContext';
import MetricCard from '../features/dashboard/MetricCard';
import MealSection from '../features/dashboard/MealSection';
import WorkoutSection from '../features/dashboard/WorkoutSection';
import GoalSummary from '../features/dashboard/GoalSummary';
import SkeletonCard from '../components/ui/SkeletonCard';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import GoalModal from '../components/ui/GoalModal';
import CancelGoalModal from '../components/ui/CancelGoalModal';
import NotificationOverlay from '../components/ui/NotificationOverlay';

import { motion } from 'framer-motion';
import { staggerContainer, staggerItem } from '../animations/variants';
import {
  IoFlameOutline,
  IoHeartOutline,
  IoWaterOutline,
  IoBedOutline,
  IoChatbubbleEllipsesOutline,
  IoCalendarOutline,
  IoBarChartOutline,
  IoFlagOutline,
  IoTodayOutline,
  IoCameraOutline,
  IoLockClosedOutline,
  IoArrowForward,
  IoFitnessOutline,
} from 'react-icons/io5';
import toast from 'react-hot-toast';
import ChatWidget from '../components/ChatWidget';

export default function Dashboard() {
  const { updateGoalStatus } = useAuth();
  const [loading, setLoading] = useState(true);
  const [plan, setPlan] = useState(null);
  const [goal, setGoal] = useState(null);
  const [goalModalOpen, setGoalModalOpen] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [autoPrompted, setAutoPrompted] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isChatOpen, setIsChatOpen] = useState(false); // ✅ Chat state

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      let activeGoal = null;

      try {
        const goalRes = await healthService.getActiveGoal();
        if (goalRes.success && goalRes.data) {
          activeGoal = goalRes.data;
        }
      } catch (error) {
        if (error.response?.status !== 404) {
          throw error;
        }
      }

      setGoal(activeGoal);
      updateGoalStatus(!!activeGoal);

      if (activeGoal) {
        const planRes = await healthService.getTodayPlan();
        if (planRes.success) {
          setPlan(planRes.data);
        } else {
          setPlan(null);
        }
      } else {
        setPlan(null);
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, [updateGoalStatus]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  useEffect(() => {
    if (!loading && !goal && !autoPrompted) {
      setGoalModalOpen(true);
      setAutoPrompted(true);
    }
  }, [loading, goal, autoPrompted]);

  const handleGoalSuccess = async () => {
    updateGoalStatus(true);
    setRefreshKey((k) => k + 1);
    await fetchDashboardData();
  };

  const handleCancelSuccess = async () => {
    updateGoalStatus(false);
    setPlan(null);
    setGoal(null);
    setRefreshKey((k) => k + 1);
    await fetchDashboardData();
  };

  const hubOptions = [
    {
      id: 'set-goal',
      title: 'Set Health Goal',
      description: 'Enter biometrics and preferences to generate your personalized daily plan.',
      icon: <IoFlagOutline size={28} className="text-brand" />,
      action: () => setGoalModalOpen(true),
      primary: true,
    },
    {
      id: 'today-plan',
      title: "Today's Plan",
      description: 'Set a goal to unlock meals, workouts, sleep, and hydration tailored to you.',
      icon: <IoTodayOutline size={28} className="text-water" />,
      locked: true,
      action: () => setGoalModalOpen(true),
    },
    {
      id: 'food-scan',
      title: 'Food Image Analysis',
      description: 'Upload a meal photo for AI macro estimates. (Coming soon)',
      icon: <IoCameraOutline size={28} className="text-calories" />,
      disabled: true,
    },
    {
      id: 'ai-chat',
      title: 'AI Health Chat',
      description: 'Ask questions about calories, food swaps, and wellness tips.',
      icon: <IoChatbubbleEllipsesOutline size={28} className="text-brand" />,
      action: () => setIsChatOpen(true), // ✅ Open chat
      disabled: false, // ✅ Chat is now enabled
    },
    {
      id: 'progress',
      title: 'Progress & History',
      description: 'Track weight logs, trends, and weekly reports.',
      icon: <IoBarChartOutline size={28} className="text-water" />,
      disabled: true,
    },
    {
      id: 'calendar',
      title: 'Weekly Schedule',
      description: 'Plan workouts and meal prep across the week.',
      icon: <IoCalendarOutline size={28} className="text-sleep" />,
      disabled: true,
    },
  ];

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <SkeletonCard rows={2} />
            <SkeletonCard rows={2} />
            <SkeletonCard rows={2} />
            <SkeletonCard rows={2} />
          </div>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
              <SkeletonCard rows={4} />
              <SkeletonCard rows={4} />
            </div>
            <SkeletonCard rows={3} />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const showPlan = Boolean(goal && plan);

  return (
    <DashboardLayout>
      {/* ✅ Chat Widget */}
      <ChatWidget 
        isOpen={isChatOpen} 
        onClose={() => setIsChatOpen(false)}
        userGoal={goal}
      />

      <NotificationOverlay refreshTrigger={refreshKey} />

      <GoalModal
        isOpen={goalModalOpen}
        onClose={() => setGoalModalOpen(false)}
        onSuccess={handleGoalSuccess}
      />

      <CancelGoalModal
        isOpen={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        onSuccess={handleCancelSuccess}
      />

      {!showPlan ? (
        <motion.div
          className="space-y-8"
          variants={staggerContainer}
          initial="initial"
          animate="animate"
        >
          {/* No-goal CTA banner */}
          <motion.div
            variants={staggerItem}
            className="relative overflow-hidden rounded-2xl border border-brand/30 bg-gradient-to-br from-brand/15 via-surface to-surface p-6 sm:p-8"
          >
            <IoFitnessOutline
              className="pointer-events-none absolute -right-8 -top-8 text-brand/10"
              size={180}
              aria-hidden="true"
            />
            <div className="relative z-10 max-w-xl">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-brand/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-brand">
                <IoFlagOutline size={14} />
                No active goal yet
              </span>
              <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-fg sm:text-4xl">
                Let&apos;s set up your health goal
              </h1>
              <p className="mt-2 text-fg-muted">
                Tell us a bit about yourself and we&apos;ll build a personalized daily
                plan — meals, workouts, sleep, and hydration — tailored just for you.
              </p>
              <motion.div
                className="mt-5 inline-block"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                <Button
                  size="md"
                  icon={<IoArrowForward />}
                  iconPosition="right"
                  onClick={() => setGoalModalOpen(true)}
                >
                  Create My Goal
                </Button>
              </motion.div>
            </div>
          </motion.div>

          <motion.div variants={staggerItem}>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-fg-subtle">
              Explore
            </h2>
          </motion.div>

          <motion.div
            variants={staggerItem}
            className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
          >
            {hubOptions.map((option) => (
              <Card
                key={option.id}
                hoverable={!option.disabled}
                glow={option.primary}
                className={`flex h-full flex-col items-start gap-3 text-left ${
                  option.disabled ? 'opacity-60 cursor-not-allowed' : ''
                } ${option.locked ? 'border-dashed' : ''}`}
                onClick={option.disabled ? undefined : option.action}
              >
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${
                  option.id === 'ai-chat' ? 'bg-brand/20 text-brand' : 'bg-surface-muted'
                }`}>
                  {option.icon}
                </div>
                <h3 className="text-lg font-bold text-fg">{option.title}</h3>
                <p className="flex-1 text-sm leading-relaxed text-fg-muted">{option.description}</p>
                {option.primary ? (
                  <Button size="sm" onClick={() => setGoalModalOpen(true)}>
                    Open Goal Form
                  </Button>
                ) : option.locked ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-brand/10 px-3 py-1 text-xs font-semibold text-brand">
                    <IoLockClosedOutline size={12} />
                    Set Goal to Unlock
                  </span>
                ) : option.disabled ? (
                  <span className="text-xs font-medium uppercase tracking-wide text-fg-subtle">
                    Coming soon
                  </span>
                ) : option.id === 'ai-chat' ? (
                  <Button size="sm" onClick={() => setIsChatOpen(true)}>
                    Open Chat
                  </Button>
                ) : null}
              </Card>
            ))}
          </motion.div>
        </motion.div>
      ) : (
        <motion.div
          className="space-y-6"
          variants={staggerContainer}
          initial="initial"
          animate="animate"
        >
          <motion.div variants={staggerItem} className="mb-2 flex items-center justify-between">
            <div>
              <h1 className="bg-gradient-to-r from-brand to-emerald-300 bg-clip-text text-3xl font-extrabold tracking-tight text-transparent sm:text-4xl">
                Today&apos;s Health Outlook
              </h1>
              <p className="mt-2 text-fg-muted">
                Your tailored daily plan from Health AI — meals, workouts, sleep, and hydration.
              </p>
            </div>
            {/* ✅ Quick Chat Button */}
            <Button 
              size="sm" 
              variant="secondary"
              icon={<IoChatbubbleEllipsesOutline size={18} />}
              onClick={() => setIsChatOpen(true)}
              className="gap-2"
            >
              Ask AI
            </Button>
          </motion.div>

          <motion.div
            variants={staggerItem}
            className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4"
          >
            <MetricCard
              title="Daily Target"
              value={`${plan.calories} kcal`}
              subtitle="Target calorie intake"
              icon={<IoFlameOutline />}
              accentColor="#FF6B35"
              bgColor="bg-orange-500/10"
              textColor="text-orange-400"
            />
            <MetricCard
              title="Body Mass Index"
              value={plan.bmi}
              subtitle={`BMR: ${plan.bmr} kcal`}
              icon={<IoHeartOutline />}
              accentColor="#FF4757"
              bgColor="bg-red-500/10"
              textColor="text-red-400"
            />
            <MetricCard
              title="Water Target"
              value={plan.water}
              subtitle="Hydration recommendation"
              icon={<IoWaterOutline />}
              accentColor="#2ED573"
              bgColor="bg-blue-500/10"
              textColor="text-blue-400"
            />
            <MetricCard
              title="Sleep Target"
              value={plan.sleep?.duration || '8 Hours'}
              subtitle={`Bedtime: ${plan.sleep?.bedtime || '10:30 PM'}`}
              icon={<IoBedOutline />}
              accentColor="#A29BFE"
              bgColor="bg-purple-500/10"
              textColor="text-purple-400"
            />
          </motion.div>

          <motion.div
            variants={staggerItem}
            className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3"
          >
            <div className="space-y-6 lg:col-span-2">
              <MealSection meals={plan.meals} />
              <WorkoutSection workout={plan.workout} />
            </div>

            <div className="space-y-6">
              <GoalSummary goalData={goal} onUpdateGoal={() => setGoalModalOpen(true)} />

              {/* ✅ AI Chat Card - Now Active */}
              <Card 
                className="flex flex-col items-start gap-3 cursor-pointer hover:border-brand/30 transition-colors" 
                glow
                onClick={() => setIsChatOpen(true)}
              >
                <IoChatbubbleEllipsesOutline size={32} className="text-brand" />
                <h3 className="text-lg font-bold">AI Health Chat</h3>
                <p className="text-sm leading-relaxed text-fg-muted">
                  Consult the model about calories, food options, or health tips.
                </p>
                <Button size="sm" onClick={() => setIsChatOpen(true)}>
                  Start Chat
                </Button>
              </Card>

              <Card className="flex flex-col items-start gap-3" glow>
                <IoCalendarOutline size={32} className="text-water" />
                <h3 className="text-lg font-bold">Progress & History</h3>
                <p className="text-sm leading-relaxed text-fg-muted">
                  Record weight logs and view weekly reports. (Coming soon)
                </p>
                <Button size="sm" variant="secondary" disabled icon={<IoBarChartOutline />}>
                  Reports
                </Button>
              </Card>

              <Button 
                variant="outline" 
                className="w-full border-danger text-danger hover:border-danger hover:text-danger" 
                onClick={() => setCancelModalOpen(true)}
              >
                Deactivate current goal
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </DashboardLayout>
  );
}