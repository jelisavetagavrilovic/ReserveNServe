// import type { Reservation, PreOrderItem } from "../types"
import type {
  ReservationRequest,
  ReservationResponse,
  OrderResponse,
  ReservationStatus,
  OrderRequest
} from "../types/reservation.types"

// todo: replace with real API calls when backend exists

// let mockReservations: Reservation[] = []

// const LOCAL_STORAGE_KEY = "mockReservations"

// function loadReservations(): Reservation[] {
//   const data = localStorage.getItem(LOCAL_STORAGE_KEY)
//   return data ? JSON.parse(data) : []
// }

// function saveReservations(reservations: Reservation[]) {
//   localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(reservations))
// }

const LOCAL_STORAGE_KEY = "mockReservations"

function loadReservations(): ReservationResponse[] {
  const data = localStorage.getItem(LOCAL_STORAGE_KEY)
  return data ? JSON.parse(data) : []
}

function saveReservations(reservations: ReservationResponse[]) {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(reservations))
}


// export async function getReservationsForUser(userId: string): Promise<ReservationResponse[]> {
//   return new Promise(resolve => 
//     setTimeout(() => resolve(loadReservations().filter(r => r.userId === userId)), 200))
// }

export async function getReservationsForUser(): Promise<ReservationResponse[]> {
  return new Promise((resolve) =>
    setTimeout(() => resolve(loadReservations()), 200)
  )
}

// export async function getReservationById(id: string): Promise<Reservation | undefined> {
//   return new Promise(resolve =>
//     setTimeout(() => resolve(loadReservations().find(r => r.id === id)), 200)
//   )
// }

export async function getReservationById(id: string): Promise<ReservationResponse | undefined> {
  return new Promise((resolve) =>
    setTimeout(() => resolve(loadReservations().find((r) => r.id === id)), 200)
  )
}


// export async function createReservation(reservation: Reservation): Promise<Reservation> {
//   return new Promise((resolve) => {
//     setTimeout(() => {
//       const newReservation: Reservation = {
//         ...reservation,
//         id: Math.floor(Math.random() * 1000000).toString(),
//         status: reservation.preOrders.length > 0 ? "pending" : "confirmed",
//       }

//       const reservations = loadReservations()
//       reservations.push(newReservation)
//       saveReservations(reservations)

//       resolve(newReservation)
//     }, 300)
//   })
// }


export async function createReservation(request: ReservationRequest): Promise<ReservationResponse> {
  return new Promise((resolve) => {
    setTimeout(() => {

      const orders: OrderResponse[] = request.orders.map(o => ({
        menuItemId: o.menuItemId,
        foodName: "Mock Food",
        price: 10,
        quantity: o.quantity,
        total: 10 * o.quantity
      }))

      const totalAmount = orders.reduce((sum, o) => sum + o.total, 0)

      const newReservation: ReservationResponse = {
        id: crypto.randomUUID(),

        restaurantId: request.restaurantId,
        restaurantName: "Mock Restaurant",
        restaurantAddress: "Mock Address",
        restaurantCity: "Mock City",

        tableGroupId: request.tableGroupId,
        tableLocation: "Indoor",
        tableSeats: 4,

        date: request.date,
        startTime: request.startTime,

        guestNumber: request.guestNumber,

        servingTime: request.servingTime,
        totalAmount,

        orders,

        status: orders.length > 0 ? "PendingPayment" : "Confirmed",
      }

      const reservations = loadReservations()
      reservations.push(newReservation)
      saveReservations(reservations)

      resolve(newReservation)

    }, 300)
  })
}



// export async function updateReservation(id: string, data: Partial<Reservation>): Promise<Reservation | undefined> {
//   const reservations = loadReservations()
//   const index = reservations.findIndex(r => r.id === id)
//   if (index === -1) return undefined
//   reservations[index] = { ...reservations[index], ...data }
//   saveReservations(reservations)
//   return new Promise(resolve => setTimeout(() => resolve(reservations[index]), 200))
// }

export async function updateReservation(id: string, data: Partial<ReservationResponse>): 
Promise<ReservationResponse | undefined> {
  const reservations = loadReservations()
  const index = reservations.findIndex((r) => r.id === id)

  if (index === -1) return undefined

  reservations[index] = { ...reservations[index], ...data }

  saveReservations(reservations)

  console.log("Updated reservation:", reservations[index])
  console.log("All reservations:", reservations)


  return new Promise((resolve) =>
    setTimeout(() => resolve(reservations[index]), 200)
  )
}

export async function updateReservationOrders(
  id: string,
  request: ReservationRequest
): Promise<ReservationResponse | undefined> {

  const reservations = loadReservations()
  const index = reservations.findIndex(r => r.id === id)

  if (index === -1) return undefined

  // const orders: OrderRequest[] = request.orders.map(o => ({
  //   menuItemId: o.menuItemId,
  //   foodName: "Mock Food",
  //   price: 10,
  //   quantity: o.quantity,
  //   total: 10 * o.quantity
  // }))


  const orders: OrderResponse[] = request.orders.map(o => ({
    menuItemId: o.menuItemId,
    foodName: "Mock Food",
    price: 10,
    quantity: o.quantity,
    total: 10 * o.quantity
  }))

  const totalAmount = orders.reduce((sum, o) => sum + o.total, 0)

  reservations[index] = {
    ...reservations[index],
    servingTime: request.servingTime,
    orders,
    totalAmount,
    status: orders.length > 0 ? "PendingPayment" : "Confirmed"
  }

  saveReservations(reservations)

  return new Promise(resolve =>
    setTimeout(() => resolve(reservations[index]), 200)
  )
}


export async function deleteReservation(id: string): Promise<boolean> {
  const reservations = loadReservations()
  const index = reservations.findIndex(r => r.id === id)
  if (index === -1) return false
  reservations.splice(index, 1)
  saveReservations(reservations)
  return new Promise(resolve => setTimeout(() => resolve(true), 200))
}

// export async function cancelReservation(id: string): Promise<Reservation | undefined> {
//   return updateReservation(id, { status: "cancelled" })
// } 

export async function cancelReservation(id: string): Promise<ReservationResponse | undefined> {
  return updateReservation(id, { status: "Cancelled" })
}


// export async function processPayment(
//   reservationId: string
// ): Promise<Reservation | undefined> {
//   return new Promise((resolve, reject) => {
//     setTimeout(async () => {
//       const paymentSuccessful = true 

//       if (!paymentSuccessful) {
//         await updateReservation(reservationId, { status: "failed" })
//         reject(new Error("Payment failed"))
//         return
//       }

//       const updated = await updateReservation(reservationId, {
//         status: "confirmed",
//       })

//       resolve(updated)
//     }, 2000)
//   })
// }

export async function processPayment(reservationId: string): Promise<ReservationResponse | undefined> {
  return new Promise((resolve, reject) => {
    setTimeout(async () => {

      const paymentSuccessful = true

      if (!paymentSuccessful) {
        await updateReservation(reservationId, { status: "Failed" })
        reject(new Error("Payment failed"))
        return
      }

      const updated = await updateReservation(reservationId, {
        status: "Confirmed",
      })

      resolve(updated)

    }, 2000)

  })
}

