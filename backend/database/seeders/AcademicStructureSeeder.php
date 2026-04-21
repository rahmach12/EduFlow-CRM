<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class AcademicStructureSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $filieres = [
            ['name' => 'Big Data', 'code' => 'BD'],
            ['name' => 'Intelligence Artificielle', 'code' => 'IA'],
            ['name' => 'Génie Logiciel', 'code' => 'GL'],
            ['name' => 'Sécurité Informatique', 'code' => 'SI'],
            ['name' => 'Réseaux et Télécommunications', 'code' => 'RT'],
        ];

        foreach ($filieres as $filiere) {
            \App\Models\Filiere::firstOrCreate(
                ['code' => $filiere['code']],
                ['name' => $filiere['name']]
            );
        }

        // The AcademicLevelSeeder will also run to insert the levels
        $this->call([
            AcademicLevelSeeder::class,
        ]);
    }
}
