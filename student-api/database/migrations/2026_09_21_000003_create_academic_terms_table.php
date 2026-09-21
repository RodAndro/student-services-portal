<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('academic_terms', function (Blueprint $table) {
            $table->id();
            $table->string('academic_year');
            $table->unsignedTinyInteger('semester');
            $table->date('start_date');
            $table->date('end_date');
            $table->string('status')->default('ACTIVE')->index();
            $table->timestamps();

            $table->unique(['academic_year', 'semester'], 'academic_terms_year_semester_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('academic_terms');
    }
};
