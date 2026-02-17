import type { Reservation, PreOrderItem } from "../types"

// todo: replace with real API calls when backend exists

// let mockReservations: Reservation[] = []

const LOCAL_STORAGE_KEY = "mockReservations"

function loadReservations(): Reservation[] {
  const data = localStorage.getItem(LOCAL_STORAGE_KEY)
  return data ? JSON.parse(data) : []
}

function saveReservations(reservations: Reservation[]) {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(reservations))
}


// export async function getReservationsForUser(userId: number): Promise<Reservation[]> {
//   return new Promise(resolve => 
//     setTimeout(() => resolve(mockReservations.filter(r => r.userId === userId)), 200))
// }

// export async function getReservationById(id: number): Promise<Reservation | undefined> {
//   return new Promise(resolve =>
//     setTimeout(() => resolve(mockReservations.find(r => r.id === id)), 200)
//   )
// }

// // export async function createReservation(reservation: Omit<Reservation, "id">): Promise<Reservation> {
// //   const newReservation: Reservation = {
// //     ...reservation,
// //     id: Math.floor(Math.random() * 1000000),
// //   }
// //   mockReservations.push(newReservation)
// //   return new Promise(resolve => setTimeout(() => resolve(newReservation), 200))
// // }
// export async function createReservation(reservation: Reservation): Promise<Reservation> {
//   return new Promise((resolve) => {
//     setTimeout(() => {
//       const newReservation: Reservation = {
//         ...reservation,
//         id: Math.floor(Math.random() * 1000000),
//         status: reservation.preOrders.length > 0 ? "pending" : "confirmed",
//       }
//       mockReservations.push(newReservation)
//       resolve(newReservation)
//     }, 300)
//   })
// }

// export async function updateReservation(id: number, data: Partial<Reservation>): Promise<Reservation | undefined> {
//   const index = mockReservations.findIndex(r => r.id === id)
//   if (index === -1) return undefined
//   mockReservations[index] = { ...mockReservations[index], ...data }
//   return new Promise(resolve => setTimeout(() => resolve(mockReservations[index]), 200))
// }

// export async function deleteReservation(id: number): Promise<boolean> {
//   const index = mockReservations.findIndex(r => r.id === id)
//   if (index === -1) return false
//   mockReservations.splice(index, 1)
//   return new Promise(resolve => setTimeout(() => resolve(true), 200))
// }

export async function getReservationsForUser(userId: number): Promise<Reservation[]> {
  return new Promise(resolve => 
    setTimeout(() => resolve(loadReservations().filter(r => r.userId === userId)), 200))
}

export async function getReservationById(id: number): Promise<Reservation | undefined> {
  return new Promise(resolve =>
    setTimeout(() => resolve(loadReservations().find(r => r.id === id)), 200)
  )
}

export async function createReservation(reservation: Reservation): Promise<Reservation> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const newReservation: Reservation = {
        ...reservation,
        id: Math.floor(Math.random() * 1000000),
        status: reservation.preOrders.length > 0 ? "pending" : "confirmed",
      }

      const reservations = loadReservations()
      reservations.push(newReservation)
      saveReservations(reservations)

      resolve(newReservation)
    }, 300)
  })
}

export async function updateReservation(id: number, data: Partial<Reservation>): Promise<Reservation | undefined> {
  const reservations = loadReservations()
  const index = reservations.findIndex(r => r.id === id)
  if (index === -1) return undefined
  reservations[index] = { ...reservations[index], ...data }
  saveReservations(reservations)
  return new Promise(resolve => setTimeout(() => resolve(reservations[index]), 200))
}

export async function deleteReservation(id: number): Promise<boolean> {
  const reservations = loadReservations()
  const index = reservations.findIndex(r => r.id === id)
  if (index === -1) return false
  reservations.splice(index, 1)
  saveReservations(reservations)
  return new Promise(resolve => setTimeout(() => resolve(true), 200))
}


export async function processPayment(
  reservationId: number
): Promise<Reservation | undefined> {
  return new Promise((resolve, reject) => {
    setTimeout(async () => {
      const paymentSuccessful = true 

      if (!paymentSuccessful) {
        await updateReservation(reservationId, { status: "failed" })
        reject(new Error("Payment failed"))
        return
      }

      const updated = await updateReservation(reservationId, {
        status: "confirmed",
      })

      resolve(updated)
    }, 2000)
  })
}

