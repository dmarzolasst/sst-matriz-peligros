export type LevelOption = { value: number; label: string; description: string };

export type NpRangeOption = { min: number; max: number; label: string; description: string };

export type NrRangeOption = {
  min: number;
  max: number;
  label: string;
  description: string;
  priority: string;
  acceptability: string;
};

export type Methodology = {
  id: string;
  name: string;
  ndLevels: LevelOption[];
  neLevels: LevelOption[];
  ncLevels: LevelOption[];
  npRanges: NpRangeOption[];
  nrRanges: NrRangeOption[];
};
