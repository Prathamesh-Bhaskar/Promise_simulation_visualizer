import React, { useState, useEffect, useCallback } from 'react';
import { AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

const exampleTasks = [
  { id: 1, name: "Ordering a Pizza" },
  { id: 2, name: "Booking a Flight" },
  { id: 3, name: "Downloading a File" },
  { id: 4, name: "Sending an Email" },
  { id: 5, name: "Getting a Loan Approval" }
];

const TaskCard = ({ task, status, step, timeElapsed }) => {
  const getStatusColor = () => {
    switch (status) {
      case 'Pending': return 'bg-yellow-100 border-yellow-400';
      case 'Completed': return 'bg-green-100 border-green-400';
      case 'Failed': return 'bg-red-100 border-red-400';
      default: return 'bg-gray-100 border-gray-400';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'Pending': return <Clock className="text-yellow-500" />;
      case 'Completed': return <CheckCircle className="text-green-500" />;
      case 'Failed': return <AlertCircle className="text-red-500" />;
      default: return null;
    }
  };

  return (
    <div className={`p-4 mb-4 rounded-lg border ${getStatusColor()}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{task.name}</h3>
        {getStatusIcon()}
      </div>
      <p className="mt-2">Status: {status}</p>
      <p>{step}</p>
      {timeElapsed && <p>Time: {timeElapsed.toFixed(1)}s</p>}
    </div>
  );
};

const Timer = ({ isRunning, timeElapsed }) => {
  return (
    <div className="flex items-center justify-center mb-4">
      {isRunning && (
        <div className="relative">
          <div className="h-20 w-20 border-4 border-blue-400 rounded-full animate-spin">
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-lg font-bold">{timeElapsed.toFixed(1)}s</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const Log = ({ log }) => {
  if (!log) return null;

  const isSuccess = log.includes('resolved');
  const logColor = isSuccess ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700';

  return (
    <div className={`p-4 rounded-lg ${logColor} mb-4`}>
      <p>{log}</p>
    </div>
  );
};

const App = () => {
  const [tasks, setTasks] = useState([]);
  const [log, setLog] = useState('');
  const [completedTasks, setCompletedTasks] = useState([]);
  const [currentState, setCurrentState] = useState('Pending');
  const [taskCounter, setTaskCounter] = useState(0);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  const processTask = useCallback((task) => {
    return new Promise((resolve, reject) => {
      setCurrentState('Pending');
      setIsRunning(true);
      setTimeElapsed(0);
      const processingTime = Math.random() * 2000 + 1000; // 1 to 3 seconds
      const shouldFail = Math.random() > 0.8; // 20% chance of failure

      const timerInterval = setInterval(() => {
        setTimeElapsed((prev) => {
          if (prev >= processingTime / 1000) {
            clearInterval(timerInterval);
            return prev;
          }
          return prev + 0.1;
        });
      }, 100);

      setTimeout(() => {
        clearInterval(timerInterval);
        setIsRunning(false);
        if (shouldFail) {
          setCurrentState('Rejected');
          setLog(`Promise for ${task.name} was rejected after ${(processingTime / 1000).toFixed(1)} seconds due to an error.`);
          reject(`Promise for ${task.name} was rejected.`);
        } else {
          setCurrentState('Fulfilled');
          setLog(`Promise for ${task.name} resolved successfully after ${(processingTime / 1000).toFixed(1)} seconds.`);
          resolve(`Promise for ${task.name} resolved.`);
        }
      }, processingTime);
    });
  }, []);

  const addTask = useCallback(() => {
    const newTask = exampleTasks[taskCounter % exampleTasks.length];
    setTaskCounter((prevCounter) => prevCounter + 1);

    const taskWithMetadata = {
      ...newTask,
      status: 'Pending',
      step: 'Task Created',
      startTime: Date.now(),
    };

    setTasks((prevTasks) => [...prevTasks, taskWithMetadata]);
    setLog(`Promise for ${newTask.name} created and pending resolution.`);

    processTask(newTask)
      .then(() => {
        setTasks((prevTasks) =>
          prevTasks.map((t) =>
            t.id === newTask.id
              ? { ...t, status: 'Completed', step: 'Promise resolved' }
              : t
          )
        );
        setCompletedTasks((prevCompleted) => [...prevCompleted, newTask]);
      })
      .catch(() => {
        setTasks((prevTasks) =>
          prevTasks.map((t) =>
            t.id === newTask.id
              ? { ...t, status: 'Failed', step: 'Promise rejected' }
              : t
          )
        );
      });
  }, [taskCounter, processTask]);

  const addChainedTasks = useCallback(() => {
    setLog('Starting chained tasks...');
    const tasksToExecute = [1, 2, 3].map((id) => exampleTasks[id]);
    const promises = tasksToExecute.map(task => processTask(task));

    promises.reduce((promiseChain, currentTask) => {
      return promiseChain.then(() => {
        return currentTask;
      }).then((result) => {
        setLog(result);
        setCompletedTasks((prev) => [...prev, tasksToExecute.shift()]);
      }).catch((error) => {
        setLog(error);
      });
    }, Promise.resolve());
  }, [processTask]);

  const addAllTasks = useCallback(() => {
    setLog('Starting all tasks in parallel...');
    const promises = exampleTasks.map(task => processTask(task));

    Promise.all(promises)
      .then(() => {
        setLog('All tasks resolved successfully!');
      })
      .catch((error) => {
        setLog(`One or more tasks failed: ${error}`);
      });
  }, [processTask]);

  const addRaceTasks = useCallback(() => {
    setLog('Starting race between tasks...');
    const promises = exampleTasks.map(task => processTask(task));

    Promise.race(promises)
      .then((result) => {
        setLog(`First task resolved: ${result}`);
      })
      .catch((error) => {
        setLog(`First task failed: ${error}`);
      });
  }, [processTask]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTasks((prevTasks) =>
        prevTasks.map((task) => ({
          ...task,
          timeElapsed: (Date.now() - task.startTime) / 1000,
        }))
      );
    }, 100);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="container mx-auto p-4 bg-light-blue-100">
      <h1 className="text-3xl font-bold mb-4">JavaScript Promises Simulation</h1>
      <button
        onClick={addTask}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 mr-2"
      >
        Add Task
      </button>
      <button
        onClick={addChainedTasks}
        className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 mr-2"
      >
        Execute Chained Tasks
      </button>
      <button
        onClick={addAllTasks}
        className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 mr-2"
      >
        Execute All Tasks
      </button>
      <button
        onClick={addRaceTasks}
        className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
      >
        Race Tasks
      </button>

      <Timer isRunning={isRunning} timeElapsed={timeElapsed} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        <div>
          <h2 className="text-2xl font-semibold mb-2">Task Queue</h2>
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              status={task.status}
              step={task.step}
              timeElapsed={task.timeElapsed}
            />
          ))}
        </div>
        <div>
          <h2 className="text-2xl font-semibold mb-2">Log</h2>
          <Log log={log} />
        </div>
      </div>
    </div>
  );
};

export default App;
