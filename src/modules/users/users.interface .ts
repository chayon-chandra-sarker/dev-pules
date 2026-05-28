export interface IContributor {
    id: string;
    name: string;
    email: string;
    password: string;
    role?: string;
 };

 export interface IIssues {
    reporter_id: string;
    title:string; 
    description: string; 
    type:string;
    status: string
 };