<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class AcademicLevelSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $levels = [
            // Prépa
            ['name' => '1ère Prépa', 'cycle' => 'Prépa', 'slug' => 'prepa-1', 'rank' => 1],
            ['name' => '2ème Prépa', 'cycle' => 'Prépa', 'slug' => 'prepa-2', 'rank' => 2],
            
            // Licence
            ['name' => 'Licence 1', 'cycle' => 'Licence', 'slug' => 'licence-1', 'rank' => 3],
            ['name' => 'Licence 2', 'cycle' => 'Licence', 'slug' => 'licence-2', 'rank' => 4],
            ['name' => 'Terminale Licence', 'cycle' => 'Licence', 'slug' => 'licence-3', 'rank' => 5],
            
            // Cycle Ingénieur
            ['name' => 'Cycle 1', 'cycle' => 'Cycle Ingénieur', 'slug' => 'cycle-1', 'rank' => 6],
            ['name' => 'Cycle 2', 'cycle' => 'Cycle Ingénieur', 'slug' => 'cycle-2', 'rank' => 7],
            ['name' => 'Cycle 3', 'cycle' => 'Cycle Ingénieur', 'slug' => 'cycle-3', 'rank' => 8],
            
            // Master
            ['name' => 'Master 1', 'cycle' => 'Master', 'slug' => 'master-1', 'rank' => 9],
            ['name' => 'Master 2', 'cycle' => 'Master', 'slug' => 'master-2', 'rank' => 10],
        ];

        foreach ($levels as $level) {
            \App\Models\AcademicLevel::firstOrCreate(
                ['slug' => $level['slug']],
                $level
            );
        }
    }
}
