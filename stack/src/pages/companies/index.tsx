import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Mainlayout from "@/layout/Mainlayout";
import { Building, MapPin } from "lucide-react";
import React from "react";

const companies = [
    { name: "Google", location: "Mountain View, CA", tech: ["Python", "Go", "Java"], jobs: 42 },
    { name: "Microsoft", location: "Redmond, WA", tech: ["C#", "Azure", "React"], jobs: 156 },
    { name: "Meta", location: "Menlo Park, CA", tech: ["React", "Hack", "AI"], jobs: 28 },
    { name: "Netflix", location: "Los Gatos, CA", tech: ["Java", "JavaScript", "AWS"], jobs: 12 },
];

const CompaniesPage = () => {
    return (
        <Mainlayout>
            <div className="max-w-6xl mx-auto p-4">
                <h1 className="text-2xl lg:text-3xl font-bold mb-6">Top Companies</h1>
                <p className="mb-8 text-gray-600">Discover companies hiring developers like you.</p>

                <div className="grid gap-6">
                    {companies.map(company => (
                        <div key={company.name} className="flex flex-col sm:flex-row items-start sm:items-center justify-between border p-4 rounded-lg bg-white hover:border-gray-300">
                            <div className="flex gap-4">
                                <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center">
                                    <Building className="text-gray-500" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold">{company.name}</h2>
                                    <div className="flex items-center text-sm text-gray-500 mb-1">
                                        <MapPin className="w-3 h-3 mr-1" />
                                        {company.location}
                                    </div>
                                    <div className="flex gap-1 mt-2">
                                        {company.tech.map(t => (
                                            <Badge key={t} variant="outline" className="text-xs font-normal">{t}</Badge>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div className="mt-4 sm:mt-0">
                                <Button variant="secondary" className="bg-blue-50 text-blue-600 hover:bg-blue-100">
                                    View {company.jobs} Jobs
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </Mainlayout>
    );
};

export default CompaniesPage;
