-- Create the leads table
CREATE TABLE leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    name TEXT,
    phone TEXT,
    email TEXT,
    channel TEXT,
    project TEXT,
    interest TEXT,
    budget TEXT,
    timeline TEXT,
    finance TEXT,
    source TEXT,
    "unitType" TEXT,
    "lastAction" TEXT,
    "enquiryType" TEXT,
    "callOutcome" TEXT,
    turns INTEGER,
    score INTEGER,
    status TEXT,
    "minutesSaved" REAL,
    "ownerNextStep" TEXT,
    summary TEXT,
    actions JSONB
);

-- Create the meetings table
CREATE TABLE meetings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    name TEXT,
    date TEXT,
    time TEXT,
    datetime TIMESTAMP WITH TIME ZONE,
    property TEXT,
    notes TEXT
);

-- Enable Row Level Security (RLS) but allow anonymous/service key full access
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to leads" ON leads FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to meetings" ON meetings FOR ALL USING (true) WITH CHECK (true);
