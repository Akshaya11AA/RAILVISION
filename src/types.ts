export type Role='admin'|'worker'|'public';export type Priority='Critical'|'High'|'Medium'|'Low';export type Status='Active'|'In Progress'|'Completed';
export interface Issue{id:string;source:string;title:string;description:string;location:string;lat:number|null;lng:number|null;priority:Priority;status:Status;image:string;reportedBy:string;createdAt:string;updatedAt:string;assignedTo?:string}
export interface Robot{mode:string;state:string;battery:number;speed:number;lat:number;lng:number;segment:string;vibration:number;water:number;temperature:number;obstacle:number;lastSeen:string}
