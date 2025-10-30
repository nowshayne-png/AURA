import { useEffect, useState } from 'react';
import { Package, Plane, Hotel, Car, ShoppingBag, CheckCircle, XCircle, Clock, Loader } from 'lucide-react';
import { Task, tasksService } from '../services/tasks';

const getTaskIcon = (type: string) => {
  switch (type) {
    case 'restaurant':
      return Package;
    case 'flight':
      return Plane;
    case 'hotel':
      return Hotel;
    case 'ride':
      return Car;
    case 'ecommerce':
      return ShoppingBag;
    default:
      return Package;
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'completed':
      return CheckCircle;
    case 'failed':
      return XCircle;
    case 'processing':
      return Loader;
    default:
      return Clock;
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'completed':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'failed':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'processing':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    default:
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
  }
};

const getTaskTypeLabel = (type: string) => {
  switch (type) {
    case 'restaurant':
      return 'Food Order';
    case 'flight':
      return 'Flight Booking';
    case 'hotel':
      return 'Hotel Booking';
    case 'ride':
      return 'Ride Booking';
    case 'ecommerce':
      return 'Online Order';
    default:
      return 'Task';
  }
};

export default function TaskCenter() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTasks();
    const subscription = tasksService.subscribeToTasks((task) => {
      setTasks((prev) => {
        const index = prev.findIndex((t) => t.id === task.id);
        if (index >= 0) {
          const updated = [...prev];
          updated[index] = task;
          return updated;
        } else {
          return [task, ...prev];
        }
      });
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const loadTasks = async () => {
    try {
      const data = await tasksService.getAllTasks();
      setTasks(data);
    } catch (error) {
      console.error('Error loading tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader className="w-8 h-8 text-slate-900 animate-spin" />
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-8">
        <div className="w-24 h-24 bg-slate-100 rounded-3xl flex items-center justify-center mb-6">
          <Package className="w-12 h-12 text-slate-400" />
        </div>
        <h3 className="text-xl font-semibold text-slate-900 mb-2">No Tasks Yet</h3>
        <p className="text-slate-600 max-w-md">
          Your task history will appear here. Try ordering food, booking a ride, or making any other request!
        </p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-4 md:p-6 space-y-4">
      <div className="mb-6">
        <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">Task Center</h2>
        <p className="text-slate-600">Track all your actions and orders in real-time</p>
      </div>

      <div className="space-y-4">
        {tasks.map((task) => {
          const TaskIcon = getTaskIcon(task.task_type);
          const StatusIcon = getStatusIcon(task.status);
          const statusColor = getStatusColor(task.status);

          return (
            <div
              key={task.id}
              className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden border border-slate-200 animate-slideIn"
            >
              <div className="p-4 md:p-6">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
                  <div className="flex items-start space-x-3 md:space-x-4 flex-1">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg">
                      <TaskIcon className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h3 className="text-base md:text-lg font-semibold text-slate-900 truncate">{task.title}</h3>
                        <span className="text-xs text-slate-600 bg-slate-100 px-2 py-1 rounded-full whitespace-nowrap">
                          {getTaskTypeLabel(task.task_type)}
                        </span>
                      </div>
                      {task.description && (
                        <p className="text-slate-600 text-sm">{task.description}</p>
                      )}
                      <p className="text-xs text-slate-500 mt-1">
                        {new Date(task.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-full border ${statusColor}`}>
                    <StatusIcon className={`w-4 h-4 ${task.status === 'processing' ? 'animate-spin' : ''}`} />
                    <span className="text-xs font-medium capitalize">{task.status}</span>
                  </div>
                </div>

                {task.api_response && (
                  <div className="bg-slate-50 rounded-xl p-4 mt-4 border border-slate-200">
                    <h4 className="text-sm font-semibold text-slate-900 mb-3">Order Details</h4>
                    <div className="space-y-2 text-sm">
                      {task.task_type === 'restaurant' && task.api_response.orderId && (
                        <>
                          <div className="flex justify-between">
                            <span className="text-slate-600">Order ID:</span>
                            <span className="font-medium text-slate-900">{task.api_response.orderId}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-600">Restaurant:</span>
                            <span className="font-medium text-slate-900">{task.api_response.restaurant}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-600">Delivery Time:</span>
                            <span className="font-medium text-slate-900">{task.api_response.estimatedDelivery}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-600">Total:</span>
                            <span className="font-semibold text-green-600">${task.api_response.totalAmount}</span>
                          </div>
                        </>
                      )}
                      {task.task_type === 'hotel' && task.api_response.bookingId && (
                        <>
                          <div className="flex justify-between">
                            <span className="text-slate-600">Booking ID:</span>
                            <span className="font-medium text-slate-900">{task.api_response.bookingId}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-600">Hotel:</span>
                            <span className="font-medium text-slate-900">{task.api_response.hotelName}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-600">Check-in:</span>
                            <span className="font-medium text-slate-900">{task.api_response.checkIn}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-600">Total:</span>
                            <span className="font-semibold text-green-600">${task.api_response.totalAmount}</span>
                          </div>
                        </>
                      )}
                      {task.task_type === 'flight' && task.api_response.bookingId && (
                        <>
                          <div className="flex justify-between">
                            <span className="text-slate-600">Booking ID:</span>
                            <span className="font-medium text-slate-900">{task.api_response.bookingId}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-600">Flight:</span>
                            <span className="font-medium text-slate-900">{task.api_response.flightNumber}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-600">Route:</span>
                            <span className="font-medium text-slate-900">{task.api_response.from} → {task.api_response.to}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-600">Total:</span>
                            <span className="font-semibold text-green-600">${task.api_response.totalAmount}</span>
                          </div>
                        </>
                      )}
                      {task.task_type === 'ride' && task.api_response.rideId && (
                        <>
                          <div className="flex justify-between">
                            <span className="text-slate-600">Ride ID:</span>
                            <span className="font-medium text-slate-900">{task.api_response.rideId}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-600">Driver:</span>
                            <span className="font-medium text-slate-900">{task.api_response.driverName}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-600">Vehicle:</span>
                            <span className="font-medium text-slate-900">{task.api_response.vehicleType}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-600">Fare:</span>
                            <span className="font-semibold text-green-600">${task.api_response.fare}</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {task.error_message && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-4">
                    <p className="text-sm text-red-600">{task.error_message}</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
