import type { Prisma } from "@prisma/client";

export type HazardWithRelations = Prisma.HazardGetPayload<{
  include: {
    classification: true;
    description: true;
    existingControls: true;
    riskAssessment: true;
    controlCriteria: { include: { legalRequirement: true } };
    interventionMeasure: true;
  };
}>;

export type TaskListItem = Prisma.TaskGetPayload<{
  include: {
    activity: { include: { process: true } };
    area: true;
    hazards: true;
  };
}>;

export type TaskWithRelations = Prisma.TaskGetPayload<{
  include: {
    activity: { include: { process: true } };
    area: true;
    riskMatrix: { include: { company: true; methodologyVersion: true } };
    hazards: {
      include: {
        classification: true;
        description: true;
        existingControls: true;
        riskAssessment: true;
        controlCriteria: { include: { legalRequirement: true } };
        interventionMeasure: true;
      };
    };
  };
}>;
