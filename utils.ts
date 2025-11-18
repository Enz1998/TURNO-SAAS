export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const addMinutes = (time: string, minutes: number): string => {
  const [hours, mins] = time.split(':').map(Number);
  const date = new Date();
  date.setHours(hours, mins, 0, 0);
  date.setMinutes(date.getMinutes() + minutes);
  return date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false });
};

export const generateTimeSlots = (
  durationMinutes: number, 
  bookedTimes: { start: string; end: string }[],
  startStr: string = "09:00",
  endStr: string = "18:00"
): string[] => {
  const slots: string[] = [];
  
  const [startHourStr, startMinStr] = startStr.split(':');
  const [endHourStr, endMinStr] = endStr.split(':');
  
  let currentHour = parseInt(startHourStr);
  let currentMinute = parseInt(startMinStr);
  
  const endHour = parseInt(endHourStr);
  const endMinute = parseInt(endMinStr);

  // Safety break to prevent infinite loops if times are weird
  let iterations = 0;
  const MAX_ITERATIONS = 100; 

  while (iterations < MAX_ITERATIONS) {
    iterations++;
    
    // Stop if we've passed the end time
    if (currentHour > endHour || (currentHour === endHour && currentMinute >= endMinute)) {
      break;
    }

    const timeString = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;
    
    // Calculate potential end time for this slot
    const [h, m] = timeString.split(':').map(Number);
    const endDate = new Date();
    endDate.setHours(h, m + durationMinutes, 0);
    const endH = endDate.getHours();
    const endM = endDate.getMinutes();
    const endTimeString = `${endH.toString().padStart(2, '0')}:${endM.toString().padStart(2, '0')}`;
    
    // Check if service ends after working hours
    if (endH > endHour || (endH === endHour && endM > endMinute)) {
      break;
    }

    // Check overlap
    const isOverlapping = bookedTimes.some(booking => {
      return (
        (timeString >= booking.start && timeString < booking.end) || // Starts inside a booking
        (endTimeString > booking.start && endTimeString <= booking.end) || // Ends inside a booking
        (timeString <= booking.start && endTimeString >= booking.end) // Encompasses a booking
      );
    });

    if (!isOverlapping) {
      slots.push(timeString);
    }

    // Interval increment (we step by duration to create clean slots, or smaller increments if you want flexible starting times)
    // Here we increment by duration to create distinct blocks, or 30 mins/15 mins for more flexibility. 
    // Let's use the service duration to optimize tight scheduling, or 15min blocks for flexibility.
    // Using durationMinutes ensures clean stacking.
    // Using a fixed step (e.g., 30) allows "interleaved" slots. Let's stick to duration for simplicity in "filling" the hours.
    // EDIT: To allow flexibility, usually systems step by 15 or 30 mins regardless of duration. 
    // Let's use 30 min steps if duration >= 30, or 15 if duration < 30.
    
    const step = durationMinutes < 30 ? 15 : 30;

    currentMinute += step;
    while (currentMinute >= 60) {
      currentHour += 1;
      currentMinute -= 60;
    }
  }

  return slots;
};