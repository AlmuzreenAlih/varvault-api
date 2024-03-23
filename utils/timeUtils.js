export function calculateTimeElapsed(initialDateTime) {
    // Current date and time
    const currentDateTime = new Date();
  
    // Calculate the time difference in milliseconds
    const timeDifference = currentDateTime - initialDateTime;
  
    // Convert milliseconds to seconds
    const seconds = Math.floor(timeDifference / 1000);
  
    // Convert seconds to minutes, hours, and days
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
  
    // Calculate remaining hours, minutes, and seconds
    const remainingHours = hours % 24;
    const remainingMinutes = minutes % 60;
    const remainingSeconds = seconds % 60;
  
    return {
        days,
        hours: remainingHours,
        minutes: remainingMinutes,
        seconds: remainingSeconds
    };
  }